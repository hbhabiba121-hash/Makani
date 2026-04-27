# backend/reports/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from properties.models import Property
from financials.models import FinancialRecord
from .services import FinancialReportService

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_monthly_report(request, property_id):
    """Export monthly financial report as PDF"""
    year = request.GET.get('year')
    month = request.GET.get('month')
    
    if not year or not month:
        return Response(
            {'error': 'Year and month parameters are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        year = int(year)
        month = int(month)
    except ValueError:
        return Response(
            {'error': 'Invalid year or month format'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get property
    property_obj = get_object_or_404(Property, id=property_id)
    
    # Get financial records for the specified month
    records = FinancialRecord.objects.filter(
        property_id=property_id,
        year=year,
        month=month
    )
    
    if not records.exists():
        return Response(
            {'error': f'No financial records found for {property_obj.name} in {month}/{year}'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Generate PDF
    return FinancialReportService.generate_monthly_report(property_obj, records, year, month)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_yearly_report(request, property_id):
    """Export yearly financial report as PDF"""
    year = request.GET.get('year')
    
    if not year:
        return Response(
            {'error': 'Year parameter is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        year = int(year)
    except ValueError:
        return Response(
            {'error': 'Invalid year format'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get property
    property_obj = get_object_or_404(Property, id=property_id)
    
    # Get all financial records for the year
    records = FinancialRecord.objects.filter(
        property_id=property_id,
        year=year
    ).order_by('month')
    
    if not records.exists():
        return Response(
            {'error': f'No financial records found for {property_obj.name} in {year}'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Generate PDF
    return FinancialReportService.generate_yearly_report(property_obj, records, year)