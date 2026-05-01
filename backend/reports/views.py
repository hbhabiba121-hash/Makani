# backend/reports/views.py - COMPLETE FIXED VERSION WITH OWNER_ID SUPPORT

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
from .services import FinancialReportService
import json


def get_month_name(month):
    months = ['January', 'February', 'March', 'April', 'May', 'June',
              'July', 'August', 'September', 'October', 'November', 'December']
    return months[month - 1] if 1 <= month <= 12 else 'Unknown'

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_reports(request):
    """Get all reports with filtering options"""
    user = request.user
    
    # Get filter parameters
    property_id = request.GET.get('property_id')
    report_type = request.GET.get('report_type')
    report_scope = request.GET.get('report_scope')
    month = request.GET.get('month')
    year = request.GET.get('year')
    
    # Build query
    reports = Report.objects.all()
    
    # Filter by report_scope
    if report_scope:
        reports = reports.filter(report_scope=report_scope)
    
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
    
    # For owner users, only show reports for their properties OR reports with null property that belong to them
    if user.role == 'owner':
        owner_properties = Property.objects.filter(owner__user=user)
        owner_property_ids = list(owner_properties.values_list('id', flat=True))
        
        # Show reports that either:
        # 1. Have a property that belongs to the owner
        # 2. Have null property (all properties report) but the report was generated for this owner
        #    (check if the report name contains owner name or details reference owner)
        reports = reports.filter(
            Q(property__in=owner_properties) |  # Report for specific property they own
            Q(property__isnull=True)  # Report for all properties (could be owner-specific)
        )
        
        # Additional filtering: For null property reports, we need to check if they belong to this owner
        # This requires checking the report details JSON or name
        filtered_reports = []
        for report in reports:
            if report.property is not None:
                # Property exists, already filtered by Q above
                filtered_reports.append(report)
            else:
                # Null property - check if this report belongs to this owner
                # Check report name or details for owner reference
                details = report.details or {}
                properties_in_report = details.get('properties', [])
                
                # If any property in the report belongs to this owner, include it
                owner_property_ids_set = set(owner_property_ids)
                report_property_ids = [p.get('id') for p in properties_in_report]
                
                if any(pid in owner_property_ids_set for pid in report_property_ids):
                    filtered_reports.append(report)
        
        reports = filtered_reports
    
    reports = sorted(reports, key=lambda x: x.created_at, reverse=True)
    
    # Serialize data
    reports_data = []
    for report in reports:
        if report.report_scope == 'agency':
            total_revenue = 0
            total_commission = float(report.agency_total_commission)
            total_expenses = float(report.agency_total_expenses)
            net_profit = float(report.agency_net_profit)
        else:  # owner report
            total_revenue = float(report.owner_total_revenue)
            total_commission = float(report.owner_total_commission)
            total_expenses = float(report.owner_total_expenses)
            net_profit = float(report.owner_net_profit)
        
        reports_data.append({
            'id': report.id,
            'name': report.name,
            'report_type': report.report_type,
            'report_scope': report.report_scope,
            'month': report.month,
            'year': report.year,
            'property_id': report.property.id if report.property else None,
            'property_name': report.property.name if report.property else 'All Your Properties',
            'total_revenue': total_revenue,
            'total_commission': total_commission,
            'total_expenses': total_expenses,
            'net_profit': net_profit,
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
    """Generate a report for specific property, owner, or all properties"""
    user = request.user
    
    try:
        report_type = request.data.get('report_type', 'monthly')
        report_scope = request.data.get('report_scope', 'agency')
        property_id = request.data.get('property_id')
        owner_id = request.data.get('owner_id')  # NEW: owner_id parameter
        month = request.data.get('month')
        year = request.data.get('year')
        
        if not year:
            return Response({'error': 'Year is required'}, status=400)
        
        if report_type == 'monthly' and not month:
            return Response({'error': 'Month is required for monthly report'}, status=400)
        
        year = int(year)
        if month:
            month = int(month)
        
        # For owner users, they can only generate owner reports for their properties
        if user.role == 'owner' and report_scope != 'owner':
            return Response({'error': 'Property owners can only generate Owner Reports'}, status=403)
        
        # Get properties based on selection and user role
        selected_owner = None
        
        # NEW: Handle owner_id first
        if owner_id:
            from owners.models import Owner
            try:
                selected_owner = Owner.objects.get(id=owner_id)
                properties = Property.objects.filter(owner=selected_owner)
                if not properties.exists():
                    return Response({'error': f'No properties found for this owner'}, status=404)
            except Owner.DoesNotExist:
                return Response({'error': 'Owner not found'}, status=404)
        elif property_id and property_id != 'all':
            try:
                properties = Property.objects.filter(id=property_id)
                if user.role == 'owner':
                    owner_properties = Property.objects.filter(owner__user=user)
                    if not properties.filter(id__in=owner_properties).exists():
                        return Response({'error': 'You do not have access to this property'}, status=403)
                if not properties.exists():
                    return Response({'error': 'Property not found'}, status=404)
            except:
                return Response({'error': 'Invalid property ID'}, status=400)
        else:
            if user.role == 'admin' or user.role == 'staff':
                if user.role == 'admin':
                    properties = Property.objects.all()
                else:
                    properties = Property.objects.filter(agency=user.agency)
            elif user.role == 'owner':
                properties = Property.objects.filter(owner__user=user)
            else:
                properties = Property.objects.none()
        
        # Build detailed report data
        property_details = []
        
        if report_scope == 'agency':
            total_commission = 0
            total_expenses = 0
            
            for prop in properties:
                if report_type == 'monthly':
                    records = FinancialRecord.objects.filter(
                        property=prop, month=month, year=year
                    )
                    expenses = Expense.objects.filter(
                        property=prop, date__year=year, date__month=month
                    )
                else:
                    records = FinancialRecord.objects.filter(property=prop, year=year)
                    expenses = Expense.objects.filter(property=prop, date__year=year)
                
                prop_commission = sum(float(r.get_commission()) for r in records)
                prop_expenses = sum(float(e.amount) for e in expenses)
                prop_profit = prop_commission - prop_expenses
                
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
                
                expense_details = []
                for expense in expenses:
                    expense_details.append({
                        'category': expense.category,
                        'description': expense.description,
                        'date': expense.date.strftime('%Y-%m-%d'),
                        'amount': float(expense.amount),
                        'receipt_url': expense.receipt.url if expense.receipt else None
                    })
                
                property_details.append({
                    'id': prop.id,
                    'name': prop.name,
                    'location': getattr(prop, 'location', 'N/A'),
                    'total_revenue': sum(float(r.revenue) for r in records),
                    'total_commission': prop_commission,
                    'total_expenses': prop_expenses,
                    'net_profit': prop_profit,
                    'bookings': bookings,
                    'expenses': expense_details,
                    'booking_count': len(bookings),
                    'expense_count': len(expense_details)
                })
                
                total_commission += prop_commission
                total_expenses += prop_expenses
            
            agency_net_profit = total_commission - total_expenses
            
            # Generate report name based on scope
            if owner_id and selected_owner:
                owner_name = f"{selected_owner.user.first_name} {selected_owner.user.last_name}".strip()
                if report_type == 'monthly':
                    report_name = f"Agency Report - Owner: {owner_name} - {get_month_name(month)} {year}"
                else:
                    report_name = f"Agency Report - Owner: {owner_name} - Year {year}"
            elif property_id and property_id != 'all':
                if report_type == 'monthly':
                    report_name = f"Agency Report - {properties.first().name} - {get_month_name(month)} {year}"
                else:
                    report_name = f"Agency Report - {properties.first().name} - Year {year}"
            else:
                if report_type == 'monthly':
                    report_name = f"Agency Report - {get_month_name(month)} {year}"
                else:
                    report_name = f"Agency Report - Year {year}"
            
            existing_report = Report.objects.filter(
                property_id=property_id if property_id and property_id != 'all' else None,
                report_type=report_type,
                report_scope='agency',
                month=month if report_type == 'monthly' else None,
                year=year
            ).first()
            
            report_data = {
                'summary': {
                    'total_commission': total_commission,
                    'total_expenses': total_expenses,
                    'net_profit': agency_net_profit
                },
                'properties': property_details
            }
            
            if existing_report:
                existing_report.name = report_name
                existing_report.agency_total_commission = total_commission
                existing_report.agency_total_expenses = total_expenses
                existing_report.agency_net_profit = agency_net_profit
                existing_report.property_count = len(property_details)
                existing_report.details = report_data
                existing_report.save()
                report_id = existing_report.id
            else:
                report = Report.objects.create(
                    property_id=property_id if property_id and property_id != 'all' else None,
                    report_type=report_type,
                    report_scope='agency',
                    month=month if report_type == 'monthly' else None,
                    year=year,
                    name=report_name,
                    agency_total_commission=total_commission,
                    agency_total_expenses=total_expenses,
                    agency_net_profit=agency_net_profit,
                    property_count=len(property_details),
                    details=report_data
                )
                report_id = report.id
            
            return Response({
                'message': 'Agency report generated successfully',
                'report_id': report_id,
                'name': report_name,
                'report_scope': 'agency'
            }, status=201)
            
        else:  # OWNER REPORT
            total_revenue = 0
            total_commission = 0
            total_expenses = 0
            
            for prop in properties:
                if report_type == 'monthly':
                    records = FinancialRecord.objects.filter(
                        property=prop, month=month, year=year
                    )
                    expenses = Expense.objects.filter(
                        property=prop, date__year=year, date__month=month
                    )
                else:
                    records = FinancialRecord.objects.filter(property=prop, year=year)
                    expenses = Expense.objects.filter(property=prop, date__year=year)
                
                prop_revenue = sum(float(r.revenue) for r in records)
                prop_commission = sum(float(r.get_commission()) for r in records)
                prop_expenses = sum(float(e.amount) for e in expenses)
                prop_profit = prop_revenue - prop_commission - prop_expenses
                
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
                
                expense_details = []
                for expense in expenses:
                    expense_details.append({
                        'category': expense.category,
                        'description': expense.description,
                        'date': expense.date.strftime('%Y-%m-%d'),
                        'amount': float(expense.amount),
                        'receipt_url': expense.receipt.url if expense.receipt else None
                    })
                
                property_details.append({
                    'id': prop.id,
                    'name': prop.name,
                    'location': getattr(prop, 'location', 'N/A'),
                    'total_revenue': prop_revenue,
                    'total_commission': prop_commission,
                    'total_expenses': prop_expenses,
                    'net_profit': prop_profit,
                    'bookings': bookings,
                    'expenses': expense_details,
                    'booking_count': len(bookings),
                    'expense_count': len(expense_details)
                })
                
                total_revenue += prop_revenue
                total_commission += prop_commission
                total_expenses += prop_expenses
            
            owner_net_profit = total_revenue - total_commission - total_expenses
            
            # Generate report name based on scope
            if owner_id and selected_owner:
                owner_name = f"{selected_owner.user.first_name} {selected_owner.user.last_name}".strip()
                if report_type == 'monthly':
                    report_name = f"Owner Report - {owner_name} - {get_month_name(month)} {year}"
                else:
                    report_name = f"Owner Report - {owner_name} - Year {year}"
            elif property_id and property_id != 'all':
                if report_type == 'monthly':
                    report_name = f"Owner Report - {properties.first().name} - {get_month_name(month)} {year}"
                else:
                    report_name = f"Owner Report - {properties.first().name} - Year {year}"
            else:
                if report_type == 'monthly':
                    report_name = f"Owner Report - {get_month_name(month)} {year}"
                else:
                    report_name = f"Owner Report - Year {year}"
            
            existing_report = Report.objects.filter(
                property_id=property_id if property_id and property_id != 'all' else None,
                report_type=report_type,
                report_scope='owner',
                month=month if report_type == 'monthly' else None,
                year=year
            ).first()
            
            report_data = {
                'summary': {
                    'total_revenue': total_revenue,
                    'total_commission': total_commission,
                    'total_expenses': total_expenses,
                    'net_profit': owner_net_profit
                },
                'properties': property_details
            }
            
            if existing_report:
                existing_report.name = report_name
                existing_report.owner_total_revenue = total_revenue
                existing_report.owner_total_commission = total_commission
                existing_report.owner_total_expenses = total_expenses
                existing_report.owner_net_profit = owner_net_profit
                existing_report.property_count = len(property_details)
                existing_report.details = report_data
                existing_report.save()
                report_id = existing_report.id
            else:
                report = Report.objects.create(
                    property_id=property_id if property_id and property_id != 'all' else None,
                    report_type=report_type,
                    report_scope='owner',
                    month=month if report_type == 'monthly' else None,
                    year=year,
                    name=report_name,
                    owner_total_revenue=total_revenue,
                    owner_total_commission=total_commission,
                    owner_total_expenses=total_expenses,
                    owner_net_profit=owner_net_profit,
                    property_count=len(property_details),
                    details=report_data
                )
                report_id = report.id
            
            return Response({
                'message': 'Owner report generated successfully',
                'report_id': report_id,
                'name': report_name,
                'report_scope': 'owner'
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
        
        user = request.user
        if user.role == 'owner':
            if report.report_scope != 'owner':
                return Response({'error': 'Access denied'}, status=403)
            if report.property and report.property.owner.user != user:
                return Response({'error': 'Access denied'}, status=403)
        
        if report.report_scope == 'agency':
            summary = {
                'total_commission': float(report.agency_total_commission),
                'total_expenses': float(report.agency_total_expenses),
                'net_profit': float(report.agency_net_profit)
            }
        else:
            summary = {
                'total_revenue': float(report.owner_total_revenue),
                'total_commission': float(report.owner_total_commission),
                'total_expenses': float(report.owner_total_expenses),
                'net_profit': float(report.owner_net_profit)
            }
        
        return Response({
            'id': report.id,
            'name': report.name,
            'report_type': report.report_type,
            'report_scope': report.report_scope,
            'month': report.month,
            'year': report.year,
            'property_id': report.property.id if report.property else None,
            'property_name': report.property.name if report.property else 'All Properties',
            'summary': summary,
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
        
        user = request.user
        if user.role == 'owner':
            if report.report_scope != 'owner':
                return Response({'error': 'Access denied'}, status=403)
            if report.property and report.property.owner.user != user:
                return Response({'error': 'Access denied'}, status=403)
        
        report.delete()
        return Response({'message': 'Report deleted successfully'}, status=200)
        
    except Report.DoesNotExist:
        return Response({'error': 'Report not found'}, status=404)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_report(request, report_id):
    """Download report as PDF"""
    try:
        report = Report.objects.get(id=report_id)
        
        user = request.user
        if user.role == 'owner':
            if report.report_scope != 'owner':
                return Response({'error': 'Access denied'}, status=403)
            if report.property and report.property.owner.user != user:
                return Response({'error': 'Access denied'}, status=403)
        
        details = report.details if report.details else {}
        properties_data = details.get('properties', [])
        
        if report.report_scope == 'agency':
            summary = {
                'total_commission': float(report.agency_total_commission),
                'total_expenses': float(report.agency_total_expenses),
                'net_profit': float(report.agency_net_profit)
            }
        else:
            summary = {
                'total_revenue': float(report.owner_total_revenue),
                'total_commission': float(report.owner_total_commission),
                'total_expenses': float(report.owner_total_expenses),
                'net_profit': float(report.owner_net_profit)
            }
        
        report_name = report.name
        period_info = "Period: "
        if report.report_type == 'monthly':
            month_name = get_month_name(report.month) if report.month else 'Unknown'
            period_info += f"{month_name} {report.year}"
        else:
            period_info += f"Year {report.year}"
        
        buffer = FinancialReportService.generate_full_report(
            {'properties': properties_data, 'summary': summary},
            report_name,
            report.report_type,
            period_info,
            report.report_scope
        )
        
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{report_name.replace(" ", "_")}.pdf"'
        return response
        
    except Report.DoesNotExist:
        return Response({'error': 'Report not found'}, status=404)
    except Exception as e:
        print(f"Error generating PDF: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)