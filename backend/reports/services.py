# backend/reports/services.py
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.pdfgen import canvas
from io import BytesIO
from django.http import HttpResponse
from datetime import datetime
from decimal import Decimal

class FinancialReportService:
    
    @staticmethod
    def generate_monthly_report(property_obj, records, year, month):
        """Generate a monthly financial report PDF"""
        
        # Create HTTP response with PDF
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="financial_report_{property_obj.name}_{year}_{month}.pdf"'
        
        # Create PDF document
        doc = SimpleDocTemplate(response, pagesize=A4, topMargin=2*cm, bottomMargin=2*cm)
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
        title = f"Financial Report - {property_obj.name}"
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
        total_revenue = sum(r.revenue for r in records)
        total_expenses = sum(r.expenses for r in records)
        total_commission = sum(r.get_commission() for r in records)
        total_payout = sum(r.get_owner_payout() for r in records)
        
        summary_data = [
            ['Summary', 'Amount (MAD)'],
            ['Total Revenue', f'{total_revenue:,.2f}'],
            ['Total Expenses', f'{total_expenses:,.2f}'],
            ['Commission (20%)', f'{total_commission:,.2f}'],
            ['Net Profit', f'{total_revenue - total_expenses:,.2f}'],
            ['Owner Payout', f'{total_payout:,.2f}']
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
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        
        elements.append(summary_table)
        elements.append(Spacer(1, 30))
        
        # Monthly breakdown table
        elements.append(Paragraph("Monthly Breakdown", header_style))
        
        breakdown_data = [['Property', 'Revenue', 'Expenses', 'Commission', 'Payout']]
        
        for record in records:
            breakdown_data.append([
                record.property.name,
                f"{record.revenue:,.2f}",
                f"{record.expenses:,.2f}",
                f"{record.get_commission():,.2f}",
                f"{record.get_owner_payout():,.2f}"
            ])
        
        # Add totals row
        breakdown_data.append([
            'TOTAL',
            f"{total_revenue:,.2f}",
            f"{total_expenses:,.2f}",
            f"{total_commission:,.2f}",
            f"{total_payout:,.2f}"
        ])
        
        breakdown_table = Table(breakdown_data, colWidths=[3*inch, 1.5*inch, 1.5*inch, 1.5*inch, 1.5*inch])
        breakdown_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c5f2d')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('BACKGROUND', (0, 1), (-1, -2), colors.lightgrey),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#97bc62')),
            ('TEXTCOLOR', (0, -1), (-1, -1), colors.white),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        
        elements.append(breakdown_table)
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
        """Generate a yearly financial report PDF"""
        
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="yearly_report_{property_obj.name}_{year}.pdf"'
        
        doc = SimpleDocTemplate(response, pagesize=landscape(A4))
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
        
        data = [['Month', 'Revenue', 'Expenses', 'Commission', 'Payout']]
        
        yearly_totals = {'revenue': 0, 'expenses': 0, 'commission': 0, 'payout': 0}
        
        for month in range(1, 13):
            month_records = [r for r in records if r.month == month]
            if month_records:
                record = month_records[0]
                revenue = record.revenue
                expenses = record.expenses
                commission = record.get_commission()
                payout = record.get_owner_payout()
                
                yearly_totals['revenue'] += revenue
                yearly_totals['expenses'] += expenses
                yearly_totals['commission'] += commission
                yearly_totals['payout'] += payout
                
                data.append([
                    month_names[month-1],
                    f"{revenue:,.2f}",
                    f"{expenses:,.2f}",
                    f"{commission:,.2f}",
                    f"{payout:,.2f}"
                ])
            else:
                data.append([month_names[month-1], "0.00", "0.00", "0.00", "0.00"])
        
        # Add totals
        data.append([
            'YEARLY TOTAL',
            f"{yearly_totals['revenue']:,.2f}",
            f"{yearly_totals['expenses']:,.2f}",
            f"{yearly_totals['commission']:,.2f}",
            f"{yearly_totals['payout']:,.2f}"
        ])
        
        table = Table(data, colWidths=[2*inch, 1.5*inch, 1.5*inch, 1.5*inch, 1.5*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c5f2d')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('BACKGROUND', (0, 1), (-1, -2), colors.lightgrey),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#97bc62')),
            ('TEXTCOLOR', (0, -1), (-1, -1), colors.white),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ]))
        
        elements.append(table)
        
        # Build PDF
        doc.build(elements)
        return response