# backend/financials/views.py

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import transaction
from django.shortcuts import get_object_or_404
import pandas as pd

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
    
    from .serializers import FinancialRecordSerializer
    serializer = FinancialRecordSerializer(records, many=True)
    return Response(serializer.data)