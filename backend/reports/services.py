# backend/reports/services.py - NO DUPLICATION

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak, Image
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from io import BytesIO
from django.http import HttpResponse
from django.conf import settings
from datetime import datetime
import os


class FinancialReportService:
    
    @staticmethod
    def generate_full_report(report_data, report_name, report_type, period_info, report_scope='agency'):
        """Generate a complete PDF report with all details including receipt images"""
        
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=1.5*cm, bottomMargin=1.5*cm, rightMargin=1.5*cm, leftMargin=1.5*cm)
        elements = []
        styles = getSampleStyleSheet()
        
        # Custom colors based on report scope
        if report_scope == 'agency':
            primary_color = colors.HexColor('#581c87')
            secondary_color = colors.HexColor('#4c1d95')
            card_bg = colors.HexColor('#f3e8ff')
        else:
            primary_color = colors.HexColor('#059669')
            secondary_color = colors.HexColor('#047857')
            card_bg = colors.HexColor('#d1fae5')
        
        danger_color = colors.HexColor('#ef4444')
        
        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=primary_color,
            alignment=TA_CENTER,
            spaceAfter=20,
            fontName='Helvetica-Bold'
        )
        
        header_style = ParagraphStyle(
            'Header',
            parent=styles['Heading2'],
            fontSize=16,
            textColor=secondary_color,
            spaceAfter=10,
            spaceBefore=20,
            fontName='Helvetica-Bold'
        )
        
        subheader_style = ParagraphStyle(
            'SubHeader',
            parent=styles['Heading3'],
            fontSize=12,
            textColor=colors.gray,
            spaceAfter=8,
            fontName='Helvetica-Bold'
        )
        
        # Title
        elements.append(Paragraph(report_name, title_style))
        
        # Generated date
        generated_date = datetime.now().strftime("%B %d, %Y at %H:%M")
        date_style = ParagraphStyle('Date', parent=styles['Normal'], fontSize=10, textColor=colors.gray, alignment=TA_CENTER)
        elements.append(Paragraph(f"Generated on {generated_date}", date_style))
        elements.append(Spacer(1, 0.3*inch))
        
        # Period info
        period_style = ParagraphStyle('Period', parent=styles['Normal'], fontSize=11, textColor=colors.gray, alignment=TA_CENTER)
        elements.append(Paragraph(period_info, period_style))
        elements.append(Spacer(1, 0.5*inch))
        
        # Summary Cards Layout
        summary_data = report_data.get('summary', {})
        properties_data = report_data.get('properties', [])
        
        # Create summary cards based on report scope
        if report_scope == 'agency':
            card_data = [
                ['Total Commission', 'Total Expenses', 'Agency Net Profit'],
                [
                    f"{summary_data.get('total_commission', 0):,.2f} DH",
                    f"{summary_data.get('total_expenses', 0):,.2f} DH",
                    f"{summary_data.get('net_profit', 0):,.2f} DH"
                ]
            ]
            card_widths = [2.8*inch, 2.8*inch, 2.8*inch]
        else:
            card_data = [
                ['Total Revenue', 'Commission', 'Expenses', 'Owner Net Profit'],
                [
                    f"{summary_data.get('total_revenue', 0):,.2f} DH",
                    f"{summary_data.get('total_commission', 0):,.2f} DH",
                    f"{summary_data.get('total_expenses', 0):,.2f} DH",
                    f"{summary_data.get('net_profit', 0):,.2f} DH"
                ]
            ]
            card_widths = [2.1*inch, 2.1*inch, 2.1*inch, 2.1*inch]
        
        card_table = Table(card_data, colWidths=card_widths)
        card_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), primary_color),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BACKGROUND', (0, 1), (-1, 1), card_bg),
            ('FONTSIZE', (0, 1), (-1, 1), 12),
            ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Bold'),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey),
            ('BOX', (0, 0), (-1, -1), 1, primary_color),
        ]))
        elements.append(card_table)
        elements.append(Spacer(1, 0.4*inch))
        
        # PROPERTY BREAKDOWN SECTION
        if len(properties_data) > 1:
            elements.append(Paragraph("📊 Property Breakdown", header_style))
            
            if report_scope == 'agency':
                property_table_data = [['Property', 'Commission (DH)', 'Expenses (DH)', 'Net Profit (DH)']]
                for prop in properties_data:
                    property_table_data.append([
                        prop.get('name', 'Unknown'),
                        f"{prop.get('total_commission', 0):,.2f}",
                        f"{prop.get('total_expenses', 0):,.2f}",
                        f"{prop.get('net_profit', 0):,.2f}"
                    ])
                col_widths = [2.8*inch, 1.8*inch, 1.8*inch, 1.8*inch]
            else:
                property_table_data = [['Property', 'Revenue (DH)', 'Commission (DH)', 'Expenses (DH)', 'Net Profit (DH)']]
                for prop in properties_data:
                    property_table_data.append([
                        prop.get('name', 'Unknown'),
                        f"{prop.get('total_revenue', 0):,.2f}",
                        f"{prop.get('total_commission', 0):,.2f}",
                        f"{prop.get('total_expenses', 0):,.2f}",
                        f"{prop.get('net_profit', 0):,.2f}"
                    ])
                col_widths = [1.8*inch, 1.3*inch, 1.3*inch, 1.3*inch, 1.3*inch]
            
            property_table = Table(property_table_data, colWidths=col_widths)
            property_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), secondary_color),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 9),
                ('FONTSIZE', (0, 1), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9f9f9')]),
            ]))
            elements.append(property_table)
            elements.append(Spacer(1, 0.3*inch))
        
        # For each property, show detailed expenses with receipts (ONLY ONCE, no duplicate bookings per property)
        for prop in properties_data:
            # Property Header
            prop_title = f"🏠 {prop.get('name', 'Property')}"
            if prop.get('location'):
                prop_title += f" - {prop.get('location')}"
            elements.append(Paragraph(prop_title, subheader_style))
            
            # Property Summary based on scope
            if report_scope == 'agency':
                prop_summary_data = [
                    ['Commission', 'Expenses', 'Net Profit'],
                    [
                        f"{prop.get('total_commission', 0):,.2f} DH",
                        f"{prop.get('total_expenses', 0):,.2f} DH",
                        f"{prop.get('net_profit', 0):,.2f} DH"
                    ]
                ]
                prop_summary_table = Table(prop_summary_data, colWidths=[2.5*inch, 2.5*inch, 2.5*inch])
            else:
                prop_summary_data = [
                    ['Revenue', 'Commission', 'Expenses', 'Net Profit'],
                    [
                        f"{prop.get('total_revenue', 0):,.2f} DH",
                        f"{prop.get('total_commission', 0):,.2f} DH",
                        f"{prop.get('total_expenses', 0):,.2f} DH",
                        f"{prop.get('net_profit', 0):,.2f} DH"
                    ]
                ]
                prop_summary_table = Table(prop_summary_data, colWidths=[1.9*inch, 1.9*inch, 1.9*inch, 1.9*inch])
            
            prop_summary_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), primary_color),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 9),
                ('BACKGROUND', (0, 1), (-1, 1), card_bg),
                ('FONTSIZE', (0, 1), (-1, 1), 11),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey),
            ]))
            elements.append(prop_summary_table)
            elements.append(Spacer(1, 0.2*inch))
            
            # EXPENSES SECTION WITH RECEIPT IMAGES (ONLY ONCE - no duplicate bookings)
            expenses = prop.get('expenses', [])
            if expenses:
                elements.append(Paragraph("💰 Expenses with Receipts", header_style))
                
                for expense in expenses:
                    # Expense details table
                    expense_data = [
                        ['Category', expense.get('category', '-')],
                        ['Description', expense.get('description', '-') if expense.get('description') else '-'],
                        ['Date', expense.get('date', '-')],
                        ['Amount', f"{expense.get('amount', 0):,.2f} DH"]
                    ]
                    
                    expense_info_table = Table(expense_data, colWidths=[1.5*inch, 4.5*inch])
                    expense_info_table.setStyle(TableStyle([
                        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3f4f6')),
                        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                        ('FONTSIZE', (0, 0), (-1, -1), 9),
                        ('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey),
                        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ]))
                    elements.append(expense_info_table)
                    elements.append(Spacer(1, 0.1*inch))
                    
                    # Receipt image if available
                    receipt_url = expense.get('receipt_url')
                    if receipt_url:
                        try:
                            if receipt_url.startswith('/media/'):
                                file_path = os.path.join(settings.MEDIA_ROOT, receipt_url.replace('/media/', ''))
                            else:
                                file_path = receipt_url
                            
                            if os.path.exists(file_path):
                                elements.append(Paragraph("📎 Receipt:", styles['Normal']))
                                img = Image(file_path, width=3*inch, height=2.5*inch)
                                elements.append(img)
                                elements.append(Spacer(1, 0.1*inch))
                            else:
                                elements.append(Paragraph(f"📎 Receipt file not found", styles['Normal']))
                        except Exception as e:
                            elements.append(Paragraph(f"📎 Receipt: {receipt_url}", styles['Normal']))
                    else:
                        elements.append(Paragraph("📎 No receipt uploaded", styles['Normal']))
                    
                    elements.append(Spacer(1, 0.2*inch))
                
                elements.append(Spacer(1, 0.2*inch))
            
            # Add message if no expenses
            if not expenses:
                elements.append(Paragraph("No expenses recorded for this property", styles['Normal']))
                elements.append(Spacer(1, 0.2*inch))
            
            elements.append(Spacer(1, 0.2*inch))
        
        # BOOKINGS SECTION - Only show ONE TIME (complete list for all properties)
        all_bookings = []
        for prop in properties_data:
            all_bookings.extend(prop.get('bookings', []))
        
        if all_bookings:
            elements.append(PageBreak())
            elements.append(Paragraph("📅 Complete Booking List", header_style))
            
            full_booking_table_data = [['Property', 'Guest', 'Source', 'Check-in', 'Check-out', 'Nights', 'Price/Night', 'Revenue', 'Commission']]
            for prop in properties_data:
                for booking in prop.get('bookings', []):
                    full_booking_table_data.append([
                        prop.get('name', 'Unknown'),
                        booking.get('guest_name', '-'),
                        booking.get('booking_source', '-'),
                        booking.get('check_in', '-'),
                        booking.get('check_out', '-'),
                        str(booking.get('nights', 0)),
                        f"{booking.get('price_per_night', 0):,.2f} DH",
                        f"{booking.get('revenue', 0):,.2f} DH",
                        f"{booking.get('commission', 0):,.2f} DH"
                    ])
            
            # Calculate column widths
            col_widths = [1.1*inch, 1.1*inch, 0.9*inch, 0.8*inch, 0.8*inch, 0.5*inch, 0.9*inch, 0.9*inch, 0.9*inch]
            
            full_booking_table = Table(full_booking_table_data, colWidths=col_widths)
            full_booking_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), primary_color),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('ALIGN', (5, 1), (5, -1), 'CENTER'),
                ('ALIGN', (6, 1), (-1, -1), 'RIGHT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 7),
                ('FONTSIZE', (0, 1), (-1, -1), 7),
                ('GRID', (0, 0), (-1, -1), 0.3, colors.lightgrey),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9f9f9')]),
            ]))
            elements.append(full_booking_table)
        
        # COMPLETE EXPENSES LIST SECTION (only if there are expenses)
        all_expenses = []
        for prop in properties_data:
            all_expenses.extend(prop.get('expenses', []))
        
        if all_expenses:
            elements.append(Spacer(1, 0.3*inch))
            elements.append(PageBreak())
            elements.append(Paragraph("💰 Complete Expenses List", header_style))
            
            full_expense_table_data = [['Property', 'Category', 'Description', 'Date', 'Amount (DH)']]
            for prop in properties_data:
                for expense in prop.get('expenses', []):
                    full_expense_table_data.append([
                        prop.get('name', 'Unknown'),
                        expense.get('category', '-'),
                        expense.get('description', '-') if expense.get('description') else '-',
                        expense.get('date', '-'),
                        f"{expense.get('amount', 0):,.2f}"
                    ])
            
            full_expense_table = Table(full_expense_table_data, colWidths=[1.5*inch, 1.2*inch, 2*inch, 1*inch, 1.2*inch])
            full_expense_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), danger_color),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('ALIGN', (4, 1), (4, -1), 'RIGHT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 8),
                ('FONTSIZE', (0, 1), (-1, -1), 7),
                ('GRID', (0, 0), (-1, -1), 0.3, colors.lightgrey),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9f9f9')]),
            ]))
            elements.append(full_expense_table)
        
        # Footer on every page
        def add_page_number(canvas, doc):
            page_num = canvas.getPageNumber()
            text = f"Makani Property Management - {report_scope.upper()} Report - Page {page_num}"
            canvas.setFont('Helvetica', 8)
            canvas.setFillColor(colors.gray)
            canvas.drawCentredString(4.25*inch, 0.5*inch, text)
        
        # Build PDF
        doc.build(elements, onFirstPage=add_page_number, onLaterPages=add_page_number)
        buffer.seek(0)
        
        return buffer

    @staticmethod
    def _get_month_name(month):
        """Helper function to get month name"""
        months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December']
        return months[month - 1] if 1 <= month <= 12 else 'Unknown'