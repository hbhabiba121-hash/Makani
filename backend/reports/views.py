# backend/reports/views.py

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum, Q
from django.http import HttpResponse
from datetime import datetime
from properties.models import Property
from financials.models import FinancialRecord, Expense
from .models import Report
import json


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_reports(request):
    """Get all reports with filtering options"""
    user = request.user
    
    # Get filter parameters
    property_id = request.GET.get('property_id')
    report_type = request.GET.get('report_type')
    month = request.GET.get('month')
    year = request.GET.get('year')
    
    # Build query
    reports = Report.objects.all()
    
    if property_id:
        if property_id == 'all':
            reports = reports.filter(property__isnull=True)
        else:
            reports = reports.filter(property_id=property_id)
    
    if report_type:
        reports = reports.filter(report_type=report_type)
    
    if month:
        reports = reports.filter(month=month)
    
    if year:
        reports = reports.filter(year=year)
    
    reports = reports.order_by('-created_at')
    
    # Serialize data
    reports_data = []
    for report in reports:
        reports_data.append({
            'id': report.id,
            'name': report.name,
            'report_type': report.report_type,
            'month': report.month,
            'year': report.year,
            'property_id': report.property.id if report.property else None,
            'property_name': report.property.name if report.property else 'All Properties',
            'total_revenue': float(report.total_revenue),
            'total_expenses': float(report.total_expenses),
            'total_commission': float(report.total_commission),
            'net_profit': float(report.net_profit),
            'property_count': report.property_count,
            'created_at': report.created_at.strftime('%B %d, %Y at %H:%M'),
            'details': report.details
        })
    
    return Response({
        'reports': reports_data,
        'total': len(reports_data)
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_report(request):
    """Generate a report for specific property or all properties"""
    user = request.user
    
    try:
        report_type = request.data.get('report_type', 'monthly')
        property_id = request.data.get('property_id')
        month = request.data.get('month')
        year = request.data.get('year')
        
        if not year:
            return Response({'error': 'Year is required'}, status=400)
        
        if report_type == 'monthly' and not month:
            return Response({'error': 'Month is required for monthly report'}, status=400)
        
        year = int(year)
        if month:
            month = int(month)
        
        # Get properties based on selection
        if property_id and property_id != 'all':
            try:
                properties = Property.objects.filter(id=property_id)
                if not properties.exists():
                    return Response({'error': 'Property not found'}, status=404)
            except:
                return Response({'error': 'Invalid property ID'}, status=400)
        else:
            # Get properties based on user role
            if user.role == 'admin':
                properties = Property.objects.all()
            elif user.role == 'staff':
                properties = Property.objects.filter(agency=user.agency)
            else:
                properties = Property.objects.filter(owner__user=user)
        
        # Build detailed report data
        property_details = []
        total_revenue = 0
        total_expenses = 0
        total_commission = 0
        
        for prop in properties:
            # Get records based on report type
            if report_type == 'monthly':
                records = FinancialRecord.objects.filter(
                    property=prop,
                    month=month,
                    year=year
                )
                expenses = Expense.objects.filter(
                    property=prop,
                    date__year=year,
                    date__month=month
                )
            else:  # yearly
                records = FinancialRecord.objects.filter(
                    property=prop,
                    year=year
                )
                expenses = Expense.objects.filter(
                    property=prop,
                    date__year=year
                )
            
            prop_revenue = sum(float(r.revenue) for r in records)
            prop_expenses = sum(float(e.amount) for e in expenses)
            prop_commission = sum(float(r.get_commission()) for r in records)
            prop_profit = prop_revenue - prop_expenses - prop_commission
            
            if prop_revenue > 0 or prop_expenses > 0:
                # Build booking details
                bookings = []
                for record in records:
                    bookings.append({
                        'guest_name': record.guest_name,
                        'booking_source': record.booking_source,
                        'check_in': record.check_in.strftime('%Y-%m-%d') if record.check_in else None,
                        'check_out': record.check_out.strftime('%Y-%m-%d') if record.check_out else None,
                        'nights': record.nights,
                        'price_per_night': float(record.price_per_night),
                        'revenue': float(record.revenue),
                        'commission': float(record.get_commission())
                    })
                
                # Build expense details
                expense_details = []
                for expense in expenses:
                    expense_details.append({
                        'category': expense.category,
                        'description': expense.description,
                        'date': expense.date.strftime('%Y-%m-%d'),
                        'amount': float(expense.amount)
                    })
                
                property_details.append({
                    'id': prop.id,
                    'name': prop.name,
                    'location': getattr(prop, 'location', 'N/A'),
                    'total_revenue': prop_revenue,
                    'total_expenses': prop_expenses,
                    'total_commission': prop_commission,
                    'net_profit': prop_profit,
                    'bookings': bookings,
                    'expenses': expense_details,
                    'booking_count': len(bookings),
                    'expense_count': len(expense_details)
                })
                
                total_revenue += prop_revenue
                total_expenses += prop_expenses
                total_commission += prop_commission
        
        net_profit = total_revenue - total_expenses - total_commission
        
        # Generate report name
        month_names = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December']
        
        if report_type == 'monthly':
            report_name = f"{month_names[month-1]} {year} Financial Report"
            if property_id and property_id != 'all':
                prop = Property.objects.get(id=property_id)
                report_name = f"{prop.name} - {month_names[month-1]} {year} Report"
        else:
            report_name = f"Yearly Financial Report - {year}"
            if property_id and property_id != 'all':
                prop = Property.objects.get(id=property_id)
                report_name = f"{prop.name} - Yearly Report {year}"
        
        # Check if report already exists
        existing_report = Report.objects.filter(
            property_id=property_id if property_id and property_id != 'all' else None,
            report_type=report_type,
            month=month if report_type == 'monthly' else None,
            year=year
        ).first()
        
        if existing_report:
            # Update existing report
            existing_report.name = report_name
            existing_report.total_revenue = total_revenue
            existing_report.total_expenses = total_expenses
            existing_report.total_commission = total_commission
            existing_report.net_profit = net_profit
            existing_report.property_count = len(property_details)
            existing_report.details = {
                'properties': property_details,
                'summary': {
                    'total_bookings': sum(p['booking_count'] for p in property_details),
                    'total_expense_items': sum(p['expense_count'] for p in property_details),
                    'average_revenue_per_property': total_revenue / len(property_details) if property_details else 0
                }
            }
            existing_report.save()
            report_id = existing_report.id
        else:
            # Create new report
            report = Report.objects.create(
                property_id=property_id if property_id and property_id != 'all' else None,
                report_type=report_type,
                month=month if report_type == 'monthly' else None,
                year=year,
                name=report_name,
                total_revenue=total_revenue,
                total_expenses=total_expenses,
                total_commission=total_commission,
                net_profit=net_profit,
                property_count=len(property_details),
                details={
                    'properties': property_details,
                    'summary': {
                        'total_bookings': sum(p['booking_count'] for p in property_details),
                        'total_expense_items': sum(p['expense_count'] for p in property_details),
                        'average_revenue_per_property': total_revenue / len(property_details) if property_details else 0
                    }
                }
            )
            report_id = report.id
        
        return Response({
            'message': 'Report generated successfully',
            'report_id': report_id,
            'name': report_name,
            'total_revenue': total_revenue,
            'total_expenses': total_expenses,
            'total_commission': total_commission,
            'net_profit': net_profit,
            'property_count': len(property_details),
            'details': property_details
        }, status=201)
        
    except Exception as e:
        print(f"Error generating report: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_report_detail(request, report_id):
    """Get detailed report by ID"""
    try:
        report = Report.objects.get(id=report_id)
        
        return Response({
            'id': report.id,
            'name': report.name,
            'report_type': report.report_type,
            'month': report.month,
            'year': report.year,
            'property_id': report.property.id if report.property else None,
            'property_name': report.property.name if report.property else 'All Properties',
            'total_revenue': float(report.total_revenue),
            'total_expenses': float(report.total_expenses),
            'total_commission': float(report.total_commission),
            'net_profit': float(report.net_profit),
            'property_count': report.property_count,
            'created_at': report.created_at.strftime('%B %d, %Y at %H:%M'),
            'details': report.details
        })
        
    except Report.DoesNotExist:
        return Response({'error': 'Report not found'}, status=404)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_report(request, report_id):
    """Delete a report"""
    try:
        report = Report.objects.get(id=report_id)
        report.delete()
        
        return Response({
            'message': 'Report deleted successfully',
            'report_id': report_id
        }, status=200)
        
    except Report.DoesNotExist:
        return Response({'error': 'Report not found'}, status=404)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_report(request, report_id):
    """Download report as PDF"""
    try:
        report = Report.objects.get(id=report_id)
        
        from reportlab.lib.pagesizes import letter, landscape
        from reportlab.pdfgen import canvas
        from reportlab.lib import colors
        from io import BytesIO
        
        buffer = BytesIO()
        
        # Use landscape for better fit
        c = canvas.Canvas(buffer, pagesize=landscape(letter))
        width, height = landscape(letter)
        
        # Title
        c.setFont("Helvetica-Bold", 20)
        c.drawString(50, height - 50, report.name)
        
        # Metadata
        c.setFont("Helvetica", 10)
        c.drawString(50, height - 80, f"Generated: {report.created_at.strftime('%B %d, %Y at %H:%M')}")
        c.drawString(50, height - 95, f"Period: {report.month}/{report.year}" if report.month else f"Year: {report.year}")
        c.drawString(50, height - 110, f"Properties: {report.property_count}")
        
        # Summary
        c.setFont("Helvetica-Bold", 14)
        c.drawString(50, height - 140, "Financial Summary")
        
        c.setFont("Helvetica", 12)
        c.drawString(50, height - 165, f"Total Revenue: {float(report.total_revenue):,.2f} DH")
        c.drawString(50, height - 180, f"Total Expenses: {float(report.total_expenses):,.2f} DH")
        c.drawString(50, height - 195, f"Total Commission: {float(report.total_commission):,.2f} DH")
        c.drawString(50, height - 210, f"Net Profit: {float(report.net_profit):,.2f} DH")
        
        c.showPage()
        c.save()
        
        buffer.seek(0)
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="report_{report_id}.pdf"'
        
        return response
        
    except Report.DoesNotExist:
        return Response({'error': 'Report not found'}, status=404)