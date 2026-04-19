def get_property_stats(property_obj):
    total_rev = sum(r.amount for r in property_obj.records if r.type == 'revenue')
    total_exp = sum(r.amount for r in property_obj.records if r.type == 'expense')
    
    commission = total_rev * property_obj.commission_rate
    owner_payout = total_rev - total_exp - commission
    
    return {
        "revenue": round(total_rev, 2),
        "expenses": round(total_exp, 2),
        "commission": round(commission, 2),
        "payout": round(owner_payout, 2)
    }