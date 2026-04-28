# backend/financials/views.py - COMPLETE FIXED VERSION

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Sum, Avg, Count, Q
from django.shortcuts import get_object_or_404
import pandas as pd
from datetime import datetime

from .models import FinancialRecord
from properties.models import Property
from .serializers import FinancialRecordSerializer

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def import_financial_csv(request):
    """Import financial records from CSV"""
    file = request.FILES.get('file')
    if not file:
        return Response({'error': 'No file provided'}, status=400)
    
    try:
        df = pd.read_csv(file)
        required_columns = ['property_id', 'month', 'year', 'revenue', 'expenses']
        
        if not all(col in df.columns for col in required_columns):
            return Response({'error': 'Missing required columns'}, status=400)
        
        with transaction.atomic():
            imported_count = 0
            for _, row in df.iterrows():
                FinancialRecord.objects.update_or_create(
                    property_id=row['property_id'],
                    month=row['month'],
                    year=row['year'],
                    defaults={
                        'revenue': row.get('revenue', 0),
                        'expenses': row.get('expenses', 0),
                        'commission_rate': row.get('commission_rate', 20),
                        'notes': row.get('notes', '')
                    }
                )
                imported_count += 1
        
        return Response({
            'status': 'success',
            'imported_count': imported_count
        })
    except Exception as e:
        return Response({'error': str(e)}, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def monthly_summary(request, property_id):
    """Get monthly summary for a property"""
    year = request.GET.get('year')
    month = request.GET.get('month')
    
    records = FinancialRecord.objects.filter(property_id=property_id)
    
    if year:
        records = records.filter(year=year)
    if month:
        records = records.filter(month=month)
    
    serializer = FinancialRecordSerializer(records, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def revenue_stats(request):
    """
    Get revenue statistics for dashboard
    """
    user = request.user
    
    # Get properties based on user role
    if user.role == 'admin':
        properties = Property.objects.all()
    elif user.role == 'staff':
        properties = Property.objects.filter(agency=user.agency)
    else:
        properties = Property.objects.filter(owner__user=user)
    
    # Get financial records for these properties
    financial_records = FinancialRecord.objects.filter(
        property__in=properties,
        year=datetime.now().year
    )
    
    # Calculate stats
    total_revenue = financial_records.aggregate(total=Sum('revenue'))['total'] or 0
    total_bookings = financial_records.count()
    avg_per_booking = total_revenue / total_bookings if total_bookings > 0 else 0
    
    # Get recent transactions (last 5 records)
    recent_records = financial_records.order_by('-year', '-month')[:10]
    
    # Transform to match frontend expected format - WITH ALL FIELDS
    transactions = []
    for record in recent_records:
        transactions.append({
            'id': record.id,
            'property': record.property.name,
            'property_id': record.property.id,
            'guest': record.guest_name,
            'guest_name': record.guest_name,
            'source': record.booking_source if record.booking_source else get_platform_from_property(record.property.name),
            'booking_source': record.booking_source,
            'date': f"{record.get_month_display()} {record.year}",
            'check_in': record.check_in.strftime('%Y-%m-%d') if record.check_in else '',
            'check_out': record.check_out.strftime('%Y-%m-%d') if record.check_out else '',
            'nights': record.nights,
            'price_per_night': float(record.price_per_night),
            'amount': float(record.revenue),
            'expenses': float(record.expenses),
            'commission': float(record.get_commission()),
            'net_profit': float(record.get_net_profit()),
            'status': 'paid'
        })
    
    return Response({
        'totalRevenue': float(total_revenue),
        'totalBookings': total_bookings,
        'avgPerBooking': float(avg_per_booking),
        'topPlatform': get_top_platform(properties),
        'growth': 12.5,
        'transactions': transactions
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def revenue_records(request):
    """Get all revenue records with filtering"""
    user = request.user
    property_id = request.GET.get('property_id')
    year = request.GET.get('year')
    month = request.GET.get('month')
    source = request.GET.get('source')
    search = request.GET.get('search')
    
    # Get properties based on user role
    if user.role == 'admin':
        properties = Property.objects.all()
    elif user.role == 'staff':
        properties = Property.objects.filter(agency=user.agency)
    else:
        properties = Property.objects.filter(owner__user=user)
    
    if property_id:
        properties = properties.filter(id=property_id)
    
    records = FinancialRecord.objects.filter(property__in=properties)
    
    if year:
        records = records.filter(year=year)
    if month:
        records = records.filter(month=month)
    
    revenue_list = []
    for record in records:
        # Use direct database fields with ALL data for editing
        revenue_list.append({
            'id': record.id,
            'property': record.property.name,
            'property_id': record.property.id,
            'guest': record.guest_name,
            'guest_name': record.guest_name,
            'source': record.booking_source if record.booking_source else get_platform_from_property(record.property.name),
            'booking_source': record.booking_source,
            'date': f"{record.get_month_display()} {record.year}",
            'check_in': record.check_in.strftime('%Y-%m-%d') if record.check_in else '',
            'check_out': record.check_out.strftime('%Y-%m-%d') if record.check_out else '',
            'nights': record.nights,
            'price_per_night': float(record.price_per_night),
            'amount': float(record.revenue),
            'expenses': float(record.expenses),
            'commission': float(record.get_commission()),
            'net_profit': float(record.get_net_profit()),
            'status': 'paid'
        })
    
    if search:
        revenue_list = [r for r in revenue_list if 
                       search.lower() in r['property'].lower() or 
                       search.lower() in r['guest'].lower()]
    
    if source and source != 'all':
        revenue_list = [r for r in revenue_list if r['source'] == source]
    
    return Response(revenue_list)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def revenue_summary(request):
    """
    Get revenue summary by month/year
    """
    user = request.user
    year = request.GET.get('year', datetime.now().year)
    
    # Get properties based on user role
    if user.role == 'admin':
        properties = Property.objects.all()
    elif user.role == 'staff':
        properties = Property.objects.filter(agency=user.agency)
    else:
        properties = Property.objects.filter(owner__user=user)
    
    # Get financial records
    records = FinancialRecord.objects.filter(
        property__in=properties,
        year=year
    )
    
    # Group by month
    monthly_data = []
    for month in range(1, 13):
        month_records = records.filter(month=month)
        total_revenue = month_records.aggregate(total=Sum('revenue'))['total'] or 0
        total_expenses = month_records.aggregate(total=Sum('expenses'))['total'] or 0
        total_commission = sum(float(r.get_commission()) for r in month_records)
        
        monthly_data.append({
            'month': month,
            'month_name': FinancialRecord.Month(month).label,
            'revenue': float(total_revenue),
            'expenses': float(total_expenses),
            'commission': float(total_commission),
            'net_profit': float(total_revenue) - float(total_expenses) - float(total_commission)
        })
    
    return Response(monthly_data)


# Helper functions
def get_platform_from_property(property_name):
    """Simulate platform based on property name"""
    platforms = ['Airbnb', 'Booking.com', 'Vrbo', 'Direct']
    index = hash(property_name) % len(platforms)
    return platforms[index]

def get_top_platform(properties):
    """Calculate top platform based on property distribution"""
    platforms = {'Airbnb': 0, 'Booking.com': 0, 'Vrbo': 0, 'Direct': 0}
    for prop in properties:
        platform = get_platform_from_property(prop.name)
        platforms[platform] += 1
    return max(platforms, key=platforms.get)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_properties(request):
    """
    Get all properties for the current user's agency
    """
    user = request.user
    
    # Get properties based on user role
    if user.role == 'admin':
        properties = Property.objects.all()
    elif user.role == 'staff':
        properties = Property.objects.filter(agency=user.agency)
    elif user.role == 'owner':
        properties = Property.objects.filter(owner__user=user)
    else:
        properties = Property.objects.none()
    
    # Serialize properties
    properties_data = []
    for property in properties:
        properties_data.append({
            'id': property.id,
            'name': property.name,
            'location': property.location if hasattr(property, 'location') else '',
            'bedrooms': getattr(property, 'bedrooms', 2),
            'bathrooms': getattr(property, 'bathrooms', 2),
            'max_guests': getattr(property, 'max_guests', 4),
            'price_per_night': getattr(property, 'price_per_night', 100),
        })
    
    return Response(properties_data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_financial_record(request):
    """Create a new financial record with all booking details"""
    data = request.data
    
    print("Received data:", data)
    
    try:
        property_obj = Property.objects.get(id=data["property_id"])
        
        # Create record with ALL fields properly stored in their own columns
        record = FinancialRecord.objects.create(
            property=property_obj,
            month=data["month"],
            year=data["year"],
            guest_name=data.get("guest_name", ""),
            booking_source=data.get("booking_source", ""),
            nights=data.get("nights", 1),
            price_per_night=data.get("price_per_night", 0),
            revenue=data.get("revenue", 0),
            expenses=data.get("expenses", 0),
            commission_rate=data.get("commission_rate", 20),
            check_in=data.get("check_in") if data.get("check_in") else None,
            check_out=data.get("check_out") if data.get("check_out") else None,
            notes=data.get("notes", "")
        )
        
        print(f"✅ Created record for {property_obj.name}, guest: {record.guest_name}")
        
        serializer = FinancialRecordSerializer(record)
        return Response(serializer.data, status=201)
        
    except Property.DoesNotExist:
        return Response({'error': 'Property not found'}, status=404)
    except Exception as e:
        print("Error:", str(e))
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)


# Single endpoint for GET, PUT, DELETE (Combined)
@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def financial_record_detail(request, record_id):
    """
    Retrieve, update or delete a financial record
    """
    try:
        record = FinancialRecord.objects.get(id=record_id)
    except FinancialRecord.DoesNotExist:
        return Response({'error': 'Record not found'}, status=404)
    
    # Check permissions
    user = request.user
    if user.role == 'admin':
        pass
    elif user.role == 'staff' and record.property.agency != user.agency:
        return Response({'error': 'Permission denied'}, status=403)
    elif user.role == 'owner' and record.property.owner.user != user:
        return Response({'error': 'Permission denied'}, status=403)
    
    if request.method == 'GET':
        # Return full record data for editing
        data = {
            'id': record.id,
            'property': record.property.name,
            'property_id': record.property.id,
            'guest_name': record.guest_name,
            'booking_source': record.booking_source,
            'nights': record.nights,
            'price_per_night': float(record.price_per_night),
            'revenue': float(record.revenue),
            'expenses': float(record.expenses),
            'commission_rate': float(record.commission_rate),
            'check_in': record.check_in.strftime('%Y-%m-%d') if record.check_in else '',
            'check_out': record.check_out.strftime('%Y-%m-%d') if record.check_out else '',
            'month': record.month,
            'year': record.year,
            'notes': record.notes,
            'status': 'paid'
        }
        return Response(data, status=200)
    
    elif request.method == 'PUT':
        data = request.data
        try:
            property_obj = Property.objects.get(id=data.get("property_id", record.property.id))
            
            # Update fields
            record.property = property_obj
            record.month = data.get("month", record.month)
            record.year = data.get("year", record.year)
            record.guest_name = data.get("guest_name", record.guest_name)
            record.booking_source = data.get("booking_source", record.booking_source)
            record.nights = data.get("nights", record.nights)
            record.price_per_night = data.get("price_per_night", record.price_per_night)
            record.revenue = data.get("revenue", record.revenue)
            record.expenses = data.get("expenses", record.expenses)
            record.commission_rate = data.get("commission_rate", record.commission_rate)
            record.check_in = data.get("check_in") if data.get("check_in") else None
            record.check_out = data.get("check_out") if data.get("check_out") else None
            record.notes = data.get("notes", record.notes)
            record.save()
            
            serializer = FinancialRecordSerializer(record)
            return Response(serializer.data, status=200)
            
        except Property.DoesNotExist:
            return Response({'error': 'Property not found'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=500)
    
    elif request.method == 'DELETE':
        record.delete()
        return Response({'status': 'success', 'message': 'Record deleted'}, status=200)
    

    # backend/financials/views.py - Add these at the end of the file

from .models import Expense
from .serializers import ExpenseSerializer
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def expense_list(request):
    """Get all expenses or create a new expense"""
    user = request.user
    
    if request.method == 'GET':
        # Get properties based on user role
        if user.role == 'admin':
            properties = Property.objects.all()
        elif user.role == 'staff':
            properties = Property.objects.filter(agency=user.agency)
        else:
            properties = Property.objects.filter(owner__user=user)
        
        expenses = Expense.objects.filter(property__in=properties)
        
        # Apply filters
        property_id = request.GET.get('property_id')
        if property_id:
            expenses = expenses.filter(property_id=property_id)
        
        category = request.GET.get('category')
        if category:
            expenses = expenses.filter(category=category)
        
        expenses = expenses.order_by('-date')
        serializer = ExpenseSerializer(expenses, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        print("=" * 50)
        print("Creating expense...")
        
        # Get data from request (works with both JSON and FormData)
        property_id = request.data.get('property_id') or request.POST.get('property_id')
        category = request.data.get('category') or request.POST.get('category')
        description = request.data.get('description') or request.POST.get('description', '')
        date = request.data.get('date') or request.POST.get('date')
        amount = request.data.get('amount') or request.POST.get('amount')
        
        print(f"property_id: {property_id}")
        print(f"category: {category}")
        print(f"amount: {amount}")
        print(f"date: {date}")
        print(f"description: {description}")
        
        # Validate required fields
        if not property_id:
            return Response({'error': 'property_id is required'}, status=400)
        if not category:
            return Response({'error': 'category is required'}, status=400)
        if not amount:
            return Response({'error': 'amount is required'}, status=400)
        if not date:
            return Response({'error': 'date is required'}, status=400)
        
        try:
            # Get the property
            property_obj = Property.objects.get(id=property_id)
            print(f"Found property: {property_obj.name}")
            
            # Create expense directly (bypass serializer if needed)
            expense = Expense.objects.create(
                property=property_obj,
                category=category,
                description=description,
                date=date,
                amount=amount,
            )
            
            # Handle receipt file if present
            if request.FILES.get('receipt'):
                expense.receipt = request.FILES['receipt']
                expense.has_receipt = True
                expense.save()
                print(f"Receipt uploaded: {expense.receipt.name}")
            
            print(f"✅ Expense created with ID: {expense.id}")
            
            # Return the created expense
            serializer = ExpenseSerializer(expense)
            return Response(serializer.data, status=201)
            
        except Property.DoesNotExist:
            print(f"Property with id {property_id} not found")
            return Response({'error': 'Property not found'}, status=404)
        except Exception as e:
            print(f"Error creating expense: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=400)
        

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def expense_detail(request, pk):
    """Get, update or delete a specific expense"""
    user = request.user
    
    try:
        expense = Expense.objects.get(id=pk)
    except Expense.DoesNotExist:
        return Response({'error': 'Expense not found'}, status=404)
    
    # Check permissions
    if user.role == 'admin':
        pass
    elif user.role == 'staff' and hasattr(expense.property, 'agency') and expense.property.agency != user.agency:
        return Response({'error': 'Permission denied'}, status=403)
    elif user.role == 'owner' and hasattr(expense.property, 'owner') and expense.property.owner.user != user:
        return Response({'error': 'Permission denied'}, status=403)
    
    if request.method == 'GET':
        serializer = ExpenseSerializer(expense)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        mutable_data = request.data.copy()
        serializer = ExpenseSerializer(expense, data=mutable_data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    
    elif request.method == 'DELETE':
        expense.delete()
        return Response({'status': 'success', 'message': 'Expense deleted'}, status=200)
    
    # backend/financials/views.py - Add reports endpoint

from datetime import datetime, timedelta
from django.db.models import Sum, Count
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from io import BytesIO
from django.http import HttpResponse

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_reports(request):
    """Get all reports with financial data for charts"""
    user = request.user
    
    # Get properties based on user role
    if user.role == 'admin':
        properties = Property.objects.all()
    elif user.role == 'staff':
        properties = Property.objects.filter(agency=user.agency)
    else:
        properties = Property.objects.filter(owner__user=user)
    
    # Get all financial records
    records = FinancialRecord.objects.filter(property__in=properties)
    
    # Group by month for performance chart
    performance_data = []
    current_year = datetime.now().year
    
    for month in range(1, 13):
        month_records = records.filter(month=month, year=current_year)
        total_revenue = month_records.aggregate(total=Sum('revenue'))['total'] or 0
        total_expenses = month_records.aggregate(total=Sum('expenses'))['total'] or 0
        total_profit = total_revenue - total_expenses
        
        performance_data.append({
            'name': FinancialRecord.Month(month).label[:3],
            'revenue': float(total_revenue),
            'expenses': float(total_expenses),
            'profit': float(total_profit)
        })
    
    # Calculate pie chart data (profit vs expenses ratio)
    total_all_revenue = records.aggregate(total=Sum('revenue'))['total'] or 0
    total_all_expenses = records.aggregate(total=Sum('expenses'))['total'] or 0
    net_profit = total_all_revenue - total_all_expenses
    
    pie_data = [
        {'name': 'Expenses', 'value': float(total_all_expenses)},
        {'name': 'Net Profit', 'value': float(net_profit) if net_profit > 0 else 0}
    ]
    
    # Generate report list
    reports_list = []
    # Generate monthly reports for the last 6 months
    for i in range(6):
        date = datetime.now() - timedelta(days=30 * i)
        month_records = records.filter(month=date.month, year=date.year)
        reports_list.append({
            'id': i + 1,
            'name': f"{FinancialRecord.Month(date.month).label} {date.year} Financial Report",
            'type': 'Monthly',
            'generated_date': (date.replace(day=1) + timedelta(days=32)).replace(day=1).strftime('%B %d, %Y'),
            'property_count': properties.count(),
            'total_revenue': float(month_records.aggregate(total=Sum('revenue'))['total'] or 0)
        })
    
    # Get latest report
    latest_report = reports_list[0] if reports_list else {}
    
    # Calculate YTD revenue
    ytd_revenue = records.filter(year=current_year).aggregate(total=Sum('revenue'))['total'] or 0
    
    return Response({
        'performance': performance_data,
        'pie_data': pie_data,
        'summary': {
            'total_reports': len(reports_list),
            'latest_report_date': latest_report.get('generated_date', 'N/A'),
            'ytd_revenue': float(ytd_revenue),
            'latest_report': {
                'name': latest_report.get('name', 'No Data'),
                'total_revenue': latest_report.get('total_revenue', 0),
                'property_count': latest_report.get('property_count', 0),
                'type': latest_report.get('type', 'N/A'),
                'generated_date': latest_report.get('generated_date', 'N/A')
            }
        },
        'reports': reports_list
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_report(request, report_id):
    """Generate and download a PDF report"""
    user = request.user
    
    # Generate PDF
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    
    # Title
    p.setFont("Helvetica-Bold", 24)
    p.drawString(50, height - 50, f"Financial Report #{report_id}")
    
    p.setFont("Helvetica", 12)
    p.drawString(50, height - 80, f"Generated on: {datetime.now().strftime('%B %d, %Y')}")
    
    # Add content
    p.setFont("Helvetica-Bold", 16)
    p.drawString(50, height - 120, "Summary")
    
    p.setFont("Helvetica", 12)
    p.drawString(50, height - 150, "This report contains financial data for all properties.")
    
    p.showPage()
    p.save()
    
    buffer.seek(0)
    
    response = HttpResponse(buffer, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="financial_report_{report_id}.pdf"'
    
    return response

