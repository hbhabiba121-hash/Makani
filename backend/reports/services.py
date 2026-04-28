# backend/reports/services.py

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, landscape, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from reportlab.pdfgen import canvas
from io import BytesIO
from django.http import HttpResponse
from datetime import datetime
from decimal import Decimal


class FinancialReportService:
    
    @staticmethod
    def generate_monthly_report(property_obj, records, year, month):
        """Generate a monthly financial report PDF for a specific property"""
        
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="monthly_report_{property_obj.name}_{year}_{month}.pdf"'
        
        # Create PDF document
        doc = SimpleDocTemplate(response, pagesize=letter, topMargin=2*cm, bottomMargin=2*cm)
        elements = []
        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1a472a'),
            alignment=TA_CENTER,
            spaceAfter=30
        )
        
        header_style = ParagraphStyle(
            'Header',
            parent=styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#2c5f2d'),
            spaceAfter=20
        )
        
        # Title
        title = f"Monthly Financial Report - {property_obj.name}"
        elements.append(Paragraph(title, title_style))
        
        # Date info
        month_names = {
            1: 'January', 2: 'February', 3: 'March', 4: 'April',
            5: 'May', 6: 'June', 7: 'July', 8: 'August',
            9: 'September', 10: 'October', 11: 'November', 12: 'December'
        }
        period = f"{month_names.get(month, '')} {year}"
        elements.append(Paragraph(f"Period: {period}", header_style))
        elements.append(Spacer(1, 20))
        
        # Summary table data
        total_revenue = sum(float(r.revenue) for r in records)
        total_expenses = sum(float(r.expenses) for r in records)
        total_commission = sum(float(r.get_commission()) for r in records)
        net_profit = total_revenue - total_expenses - total_commission
        
        summary_data = [
            ['Summary', f'Amount (DH)'],
            ['Total Revenue', f'{total_revenue:,.2f}'],
            ['Total Expenses', f'{total_expenses:,.2f}'],
            ['Commission', f'{total_commission:,.2f}'],
            ['Net Profit', f'{net_profit:,.2f}']
        ]
        
        # Create summary table
        summary_table = Table(summary_data, colWidths=[4*inch, 2.5*inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c5f2d')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ]))
        
        elements.append(summary_table)
        elements.append(Spacer(1, 30))
        
        # Footer
        footer_style = ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.grey,
            alignment=TA_CENTER
        )
        
        generated_date = datetime.now().strftime("%B %d, %Y at %H:%M")
        footer_text = f"Report generated on {generated_date} | Makani Property Management"
        elements.append(Paragraph(footer_text, footer_style))
        
        # Build PDF
        doc.build(elements)
        return response
    
    @staticmethod
    def generate_yearly_report(property_obj, records, year):
        """Generate a yearly financial report PDF for a specific property"""
        
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="yearly_report_{property_obj.name}_{year}.pdf"'
        
        doc = SimpleDocTemplate(response, pagesize=landscape(letter))
        elements = []
        styles = getSampleStyleSheet()
        
        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1a472a'),
            alignment=TA_CENTER,
            spaceAfter=30
        )
        
        title = f"Yearly Financial Report - {property_obj.name} ({year})"
        elements.append(Paragraph(title, title_style))
        
        # Monthly data table
        month_names = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December']
        
        data = [['Month', 'Revenue (DH)', 'Expenses (DH)', 'Commission (DH)', 'Net Profit (DH)']]
        
        for month in range(1, 13):
            month_records = [r for r in records if r.month == month]
            if month_records:
                record = month_records[0]
                revenue = float(record.revenue)
                expenses = float(record.expenses)
                commission = float(record.get_commission())
                profit = revenue - expenses - commission
                
                data.append([
                    month_names[month-1],
                    f'{revenue:,.2f}',
                    f'{expenses:,.2f}',
                    f'{commission:,.2f}',
                    f'{profit:,.2f}'
                ])
            else:
                data.append([month_names[month-1], "0.00", "0.00", "0.00", "0.00"])
        
        table = Table(data, colWidths=[2*inch, 1.5*inch, 1.5*inch, 1.5*inch, 1.5*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c5f2d')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ]))
        
        elements.append(table)
        
        # Build PDF
        doc.build(elements)
        return response
    
    @staticmethod
    def generate_combined_monthly_report(records, month, year):
        """Generate monthly report for all properties"""
        
        from io import BytesIO
        from reportlab.lib.pagesizes import letter
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.enums import TA_CENTER
        from django.http import HttpResponse
        
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        elements = []
        styles = getSampleStyleSheet()
        
        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1a472a'),
            alignment=TA_CENTER,
            spaceAfter=30
        )
        
        month_names = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December']
        
        title = f"Monthly Financial Report - All Properties"
        elements.append(Paragraph(title, title_style))
        
        subtitle = f"Period: {month_names[month-1]} {year}"
        elements.append(Paragraph(subtitle, styles['Heading2']))
        elements.append(Spacer(1, 20))
        
        # Summary table
        total_revenue = sum(float(r.revenue) for r in records)
        total_expenses = sum(float(r.expenses) for r in records)
        total_commission = sum(float(r.get_commission()) for r in records)
        net_profit = total_revenue - total_expenses - total_commission
        
        summary_data = [
            ['Summary', 'Amount (DH)'],
            ['Total Revenue', f'{total_revenue:,.2f}'],
            ['Total Expenses', f'{total_expenses:,.2f}'],
            ['Total Commission', f'{total_commission:,.2f}'],
            ['Net Profit', f'{net_profit:,.2f}']
        ]
        
        summary_table = Table(summary_data, colWidths=[200, 150])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c5f2d')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ]))
        
        elements.append(summary_table)
        elements.append(Spacer(1, 30))
        
        # Build PDF
        doc.build(elements)
        buffer.seek(0)
        
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="monthly_report_{month}_{year}.pdf"'
        
        return response
    
    @staticmethod
    def generate_combined_yearly_report(records, year):
        """Generate yearly report for all properties"""
        
        from io import BytesIO
        from reportlab.lib.pagesizes import landscape, letter
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.enums import TA_CENTER
        from django.http import HttpResponse
        
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=landscape(letter))
        elements = []
        styles = getSampleStyleSheet()
        
        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1a472a'),
            alignment=TA_CENTER,
            spaceAfter=30
        )
        
        title = f"Yearly Financial Report - All Properties ({year})"
        elements.append(Paragraph(title, title_style))
        elements.append(Spacer(1, 20))
        
        # Monthly data table
        month_names = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December']
        
        data = [['Month', 'Revenue (DH)', 'Expenses (DH)', 'Commission (DH)', 'Net Profit (DH)']]
        
        for month in range(1, 13):
            month_records = [r for r in records if r.month == month]
            revenue = sum(float(r.revenue) for r in month_records)
            expenses = sum(float(r.expenses) for r in month_records)
            commission = sum(float(r.get_commission()) for r in month_records)
            profit = revenue - expenses - commission
            
            data.append([
                month_names[month-1],
                f'{revenue:,.2f}',
                f'{expenses:,.2f}',
                f'{commission:,.2f}',
                f'{profit:,.2f}'
            ])
        
        table = Table(data, colWidths=[100, 100, 100, 100, 100])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c5f2d')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ]))
        
        elements.append(table)
        
        # Build PDF
        doc.build(elements)
        buffer.seek(0)
        
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="yearly_report_{year}.pdf"'
        
        return response
    
    # Add this method to FinancialReportService class

@staticmethod
def generate_combined_monthly_report(records, expenses, month, year, properties):
    """Generate monthly report for all properties with expenses"""
    
    from io import BytesIO
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_CENTER, TA_RIGHT
    from django.http import HttpResponse
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []
    styles = getSampleStyleSheet()
    
    # Title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1a472a'),
        alignment=TA_CENTER,
        spaceAfter=30
    )
    
    month_names = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December']
    
    title = f"Monthly Financial Report - All Properties"
    elements.append(Paragraph(title, title_style))
    
    subtitle = f"Period: {month_names[month-1]} {year}"
    elements.append(Paragraph(subtitle, styles['Heading2']))
    elements.append(Spacer(1, 20))
    
    # Summary table with expenses
    total_revenue = sum(float(r.revenue) for r in records) if records else 0
    total_expenses = sum(float(e.amount) for e in expenses) if expenses else 0
    net_profit = total_revenue - total_expenses
    
    summary_data = [
        ['Summary', 'Amount (DH)'],
        ['Total Revenue', f'{total_revenue:,.2f}'],
        ['Total Expenses', f'{total_expenses:,.2f}'],
        ['Net Profit', f'{net_profit:,.2f}']
    ]
    
    summary_table = Table(summary_data, colWidths=[200, 150])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c5f2d')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
    ]))
    
    elements.append(summary_table)
    elements.append(Spacer(1, 30))
    
    # Property breakdown table
    elements.append(Paragraph("Property Breakdown", styles['Heading2']))
    
    property_data = [['Property', 'Revenue (DH)', 'Expenses (DH)', 'Net Profit (DH)']]
    
    for prop in properties:
        prop_revenue = sum(float(r.revenue) for r in records if r.property.id == prop.id)
        prop_expenses = sum(float(e.amount) for e in expenses if e.property.id == prop.id)
        prop_profit = prop_revenue - prop_expenses
        
        property_data.append([
            prop.name,
            f'{prop_revenue:,.2f}',
            f'{prop_expenses:,.2f}',
            f'{prop_profit:,.2f}'
        ])
    
    property_table = Table(property_data, colWidths=[200, 100, 100, 100])
    property_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c5f2d')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
    ]))
    
    elements.append(property_table)
    
    # Footer
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.grey,
        alignment=TA_CENTER
    )
    
    generated_date = datetime.now().strftime("%B %d, %Y at %H:%M")
    footer_text = f"Report generated on {generated_date} | Makani Property Management"
    elements.append(Spacer(1, 30))
    elements.append(Paragraph(footer_text, footer_style))
    
    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    
    response = HttpResponse(buffer, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="monthly_report_{month}_{year}.pdf"'
    
    return response