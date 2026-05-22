# backend/payments/views.py - COMPLETE FULLY FIXED VERSION

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from django.db.models import Sum, Q, Avg
from django.utils import timezone
from datetime import timedelta
from .models import Payout, Payment, PaymentAlert
from .serializers import PayoutSerializer, PaymentSerializer, PaymentAlertSerializer
from financials.models import FinancialRecord
from properties.models import Property
from users.models import User


class DashboardKPIsView(APIView):
    """Get KPI cards data for dashboard"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Filter payouts based on user role
        if user.role == 'admin':
            payouts = Payout.objects.all()
        elif user.role == 'staff':
            payouts = Payout.objects.filter(agency=user.agency)
        elif user.role == 'owner':
            payouts = Payout.objects.filter(owner=user)
        else:
            payouts = Payout.objects.none()
        
        # Calculate KPIs
        total_pending = payouts.filter(status='pending').aggregate(
            total=Sum('remaining_balance')
        )['total'] or 0
        
        total_paid_month = Payment.objects.filter(
            payment_date__year=timezone.now().year,
            payment_date__month=timezone.now().month
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        total_owner_earnings = payouts.aggregate(
            total=Sum('net_owner_earnings')
        )['total'] or 0
        
        unpaid_balances = payouts.exclude(status='paid').aggregate(
            total=Sum('remaining_balance')
        )['total'] or 0
        
        upcoming_payments = payouts.filter(
            due_date__gte=timezone.now(),
            due_date__lte=timezone.now() + timedelta(days=30),
            status__in=['pending', 'partial']
        ).count()
        
        return Response({
            'total_pending_payouts': float(total_pending),
            'total_paid_this_month': float(total_paid_month),
            'total_owner_earnings': float(total_owner_earnings),
            'unpaid_balances': float(unpaid_balances),
            'upcoming_payments': upcoming_payments
        })


class PayoutListView(generics.ListCreateAPIView):
    """List and create payouts - Auto-generates from financial records"""
    serializer_class = PayoutSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Payout.objects.all().select_related('owner', 'property', 'financial_record')
        elif user.role == 'staff':
            return Payout.objects.filter(agency=user.agency).select_related('owner', 'property', 'financial_record')
        elif user.role == 'owner':
            return Payout.objects.filter(owner=user).select_related('property', 'financial_record')
        return Payout.objects.none()
    
    def perform_create(self, serializer):
        """Create payout automatically from financial record data"""
        financial_record_id = self.request.data.get('financial_record')
        
        if financial_record_id:
            financial_record = FinancialRecord.objects.get(id=financial_record_id)
            
            # Get owner from property - handle different structures
            owner = None
            if hasattr(financial_record.property, 'owner') and financial_record.property.owner:
                if hasattr(financial_record.property.owner, 'user'):
                    owner = financial_record.property.owner.user
                else:
                    owner = financial_record.property.owner
            
            # Calculate amounts
            revenue = float(financial_record.revenue) if financial_record.revenue else 0
            commission = float(financial_record.get_commission()) if hasattr(financial_record, 'get_commission') else 0
            expenses = float(financial_record.expenses) if financial_record.expenses else 0
            net_owner_earnings = revenue - commission - expenses
            
            # Get agency
            agency = financial_record.property.agency if hasattr(financial_record.property, 'agency') else None
            
            serializer.save(
                agency=agency,
                owner=owner,
                property=financial_record.property,
                financial_record=financial_record,
                total_revenue=revenue,
                commission=commission,
                expenses=expenses,
                net_owner_earnings=net_owner_earnings,
                due_date=timezone.now().date() + timedelta(days=30),
                status='pending'
            )
        else:
            # Manual creation if needed
            serializer.save(
                agency=self.request.user.agency,
                due_date=timezone.now().date() + timedelta(days=30)
            )


class PayoutSummaryView(APIView):
    """Get payout summary grouped with proper calculations"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Get all payouts based on role
        if user.role == 'admin':
            payouts = Payout.objects.all().select_related('owner', 'property')
        elif user.role == 'staff':
            payouts = Payout.objects.filter(agency=user.agency).select_related('owner', 'property')
        elif user.role == 'owner':
            payouts = Payout.objects.filter(owner=user).select_related('property')
        else:
            payouts = Payout.objects.none()
        
        # Build summary data
        summary = []
        for payout in payouts:
            summary.append({
                'id': payout.id,
                'owner_name': f"{payout.owner.first_name} {payout.owner.last_name}" if payout.owner else 'N/A',
                'owner_id': payout.owner.id if payout.owner else None,
                'property_name': payout.property.name if payout.property else 'N/A',
                'property_id': payout.property.id if payout.property else None,
                'total_revenue': float(payout.total_revenue),
                'commission': float(payout.commission),
                'expenses': float(payout.expenses),
                'net_owner_earnings': float(payout.net_owner_earnings),
                'amount_paid': float(payout.amount_paid),
                'remaining_balance': float(payout.remaining_balance),
                'status': payout.status,
                'status_display': payout.get_status_display(),
                'due_date': payout.due_date,
                'paid_date': payout.paid_date,
                'completion_percentage': payout.completion_percentage,
                'payments': [
                    {
                        'id': p.id,
                        'amount': float(p.amount),
                        'payment_method': p.payment_method,
                        'payment_method_display': p.get_payment_method_display(),
                        'payment_date': p.payment_date,
                        'transaction_id': p.transaction_id
                    } for p in payout.payments.all()
                ]
            })
        
        return Response(summary)


class PayoutDetailView(generics.RetrieveUpdateAPIView):
    """Get, update payout details"""
    queryset = Payout.objects.all()
    serializer_class = PayoutSerializer
    permission_classes = [permissions.IsAuthenticated]


class PaymentCreateView(generics.CreateAPIView):
    """Create a payment (Mark as Paid) - Updates remaining balance automatically"""
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        payout_id = self.request.data.get('payout')
        payout = Payout.objects.get(id=payout_id)
        amount = float(serializer.validated_data['amount'])
        
        # Create the payment
        payment = serializer.save(
            agency=self.request.user.agency,
            owner=payout.owner,
            property=payout.property,
            financial_record=payout.financial_record,
            created_by=self.request.user
        )
        
        # Convert Decimal to float for calculation - FIXED
        remaining_balance = float(payout.remaining_balance)
        new_remaining = remaining_balance - amount
        
        # Create alert for partial payment
        if new_remaining > 0:
            PaymentAlert.objects.create(
                agency=payout.agency,
                payout=payout,
                alert_type='partial_payment',
                title=f"Paiement partiel enregistré",
                message=f"Paiement de {amount:.2f} MAD reçu de {payout.owner.first_name}. Restant: {new_remaining:.2f} MAD"
            )
        elif abs(new_remaining) < 0.01:  # Handle floating point precision
            PaymentAlert.objects.create(
                agency=payout.agency,
                payout=payout,
                alert_type='pending_payout',
                title=f"Paiement complété",
                message=f"Le paiement pour {payout.property.name} a été complété. Montant total: {float(payout.net_owner_earnings):.2f} MAD"
            )


class PaymentHistoryView(generics.ListAPIView):
    """Get payment history"""
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Payment.objects.all().select_related('owner', 'property')
        elif user.role == 'staff':
            return Payment.objects.filter(agency=user.agency).select_related('owner', 'property')
        elif user.role == 'owner':
            return Payment.objects.filter(owner=user).select_related('property')
        return Payment.objects.none()


class PendingAlertsView(generics.ListAPIView):
    """Get pending alerts"""
    serializer_class = PaymentAlertSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return PaymentAlert.objects.filter(is_read=False)[:10]
        elif user.role == 'staff':
            return PaymentAlert.objects.filter(agency=user.agency, is_read=False)[:10]
        elif user.role == 'owner':
            return PaymentAlert.objects.filter(payout__owner=user, is_read=False)[:10]
        return PaymentAlert.objects.none()


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_alert_read(request, alert_id):
    """Mark an alert as read"""
    try:
        alert = PaymentAlert.objects.get(id=alert_id)
        alert.is_read = True
        alert.save()
        return Response({'message': 'Alert marked as read'})
    except PaymentAlert.DoesNotExist:
        return Response({'error': 'Alert not found'}, status=404)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_all_alerts_read(request):
    """Mark all alerts as read"""
    user = request.user
    if user.role == 'admin':
        PaymentAlert.objects.filter(is_read=False).update(is_read=True)
    elif user.role == 'staff':
        PaymentAlert.objects.filter(agency=user.agency, is_read=False).update(is_read=True)
    elif user.role == 'owner':
        PaymentAlert.objects.filter(payout__owner=user, is_read=False).update(is_read=True)
    return Response({'message': 'All alerts marked as read'})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def generate_statement(request, payout_id):
    """Generate payment statement for PDF export"""
    try:
        payout = Payout.objects.get(id=payout_id)
        serializer = PayoutSerializer(payout)
        return Response(serializer.data)
    except Payout.DoesNotExist:
        return Response({'error': 'Payout not found'}, status=404)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def payment_analytics(request):
    """Get payment analytics data"""
    user = request.user
    
    # Filter payouts based on user role
    if user.role == 'admin':
        payouts = Payout.objects.all()
    elif user.role == 'staff':
        payouts = Payout.objects.filter(agency=user.agency)
    elif user.role == 'owner':
        payouts = Payout.objects.filter(owner=user)
    else:
        payouts = Payout.objects.none()
    
    # Monthly payouts for chart
    monthly_data = []
    for i in range(6):
        month = timezone.now().date().replace(day=1) - timedelta(days=30*i)
        month_payouts = payouts.filter(
            paid_date__year=month.year,
            paid_date__month=month.month
        )
        monthly_data.append({
            'month': month.strftime('%B'),
            'amount': float(month_payouts.aggregate(total=Sum('amount_paid'))['total'] or 0)
        })
    
    # Status distribution
    status_distribution = {
        'paid': payouts.filter(status='paid').count(),
        'pending': payouts.filter(status='pending').count(),
        'partial': payouts.filter(status='partial').count(),
        'overdue': payouts.filter(status='overdue').count(),
    }
    
    return Response({
        'monthly_payouts': monthly_data,
        'status_distribution': status_distribution,
        'total_distributed': float(payouts.aggregate(total=Sum('amount_paid'))['total'] or 0),
        'average_payout': float(payouts.exclude(status='pending').aggregate(avg=Avg('amount_paid'))['avg'] or 0)
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def generate_payouts_from_financials(request):
    """Generate payouts from financial records that don't have payouts yet"""
    user = request.user
    
    # Get financial records without payouts
    if user.role == 'admin':
        financial_records = FinancialRecord.objects.filter(payouts__isnull=True)
    elif user.role == 'staff':
        financial_records = FinancialRecord.objects.filter(
            property__agency=user.agency,
            payouts__isnull=True
        )
    else:
        return Response({'error': 'Permission denied'}, status=403)
    
    created_count = 0
    errors = []
    skipped_no_owner = 0
    
    print(f"Found {financial_records.count()} financial records without payouts")
    
    for record in financial_records:
        try:
            print(f"Processing: {record.property.name} - Revenue: {record.revenue}")
            
            # Get owner from property - handle different possible structures
            owner = None
            
            # Check if property has owner attribute
            if hasattr(record.property, 'owner') and record.property.owner:
                if hasattr(record.property.owner, 'user'):
                    # Owner is an OwnerProfile object with user relation
                    owner = record.property.owner.user
                    print(f"  Owner found via owner.user: {owner}")
                else:
                    # Owner is already a User object
                    owner = record.property.owner
                    print(f"  Owner found directly: {owner}")
            
            if not owner:
                errors.append(f'No owner found for property: {record.property.name} (ID: {record.property.id})')
                skipped_no_owner += 1
                print(f"  ✗ No owner found")
                continue
            
            # Calculate amounts
            revenue = float(record.revenue) if record.revenue else 0
            commission = float(record.get_commission()) if hasattr(record, 'get_commission') else 0
            expenses = float(record.expenses) if record.expenses else 0
            net_owner_earnings = revenue - commission - expenses
            
            print(f"  Revenue: {revenue}, Commission: {commission}, Expenses: {expenses}, Net: {net_owner_earnings}")
            
            # Get agency
            agency = record.property.agency if hasattr(record.property, 'agency') else user.agency
            
            # Create payout
            payout = Payout.objects.create(
                agency=agency,
                owner=owner,
                property=record.property,
                financial_record=record,
                total_revenue=revenue,
                commission=commission,
                expenses=expenses,
                net_owner_earnings=net_owner_earnings,
                due_date=timezone.now().date() + timedelta(days=30),
                status='pending'
            )
            created_count += 1
            print(f"  ✓ Created payout {payout.id}")
            
        except Exception as e:
            error_msg = f'Error for {record.property.name}: {str(e)}'
            errors.append(error_msg)
            print(f"  ✗ {error_msg}")
    
    return Response({
        'message': f'Successfully generated {created_count} payouts',
        'created_count': created_count,
        'skipped_no_owner': skipped_no_owner,
        'total_records_checked': financial_records.count(),
        'errors': errors
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def test_payouts(request):
    """Simple test endpoint to check payouts"""
    user = request.user
    
    # Get all payouts (no filtering for test)
    all_payouts = Payout.objects.all()
    
    return Response({
        'total_payouts': all_payouts.count(),
        'user_role': user.role,
        'user_email': user.email,
        'payouts_list': [
            {
                'id': p.id,
                'owner': p.owner.email if p.owner else 'No owner',
                'property': p.property.name if p.property else 'No property',
                'amount': float(p.net_owner_earnings)
            } for p in all_payouts[:20]
        ]
    })