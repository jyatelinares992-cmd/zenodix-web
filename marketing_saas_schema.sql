-- Supabase Schema for Zenodix AI Marketing SaaS

-- Ensure uuid-ossp extension is enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. CRM LEADS & KANBAN (Tablero de Ventas)
-- ==========================================
CREATE TABLE crm_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL, -- Assuming integration with existing `users` table where company_id is present
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    source TEXT DEFAULT 'Manually Added', -- EJ: 'Web Auditor', 'Meta Ads', 'Organic'
    status TEXT DEFAULT 'New', -- EJ: 'New', 'In Negotiation', 'Won', 'Lost'
    ai_score INTEGER DEFAULT 0, -- Score de 0 a 100 calculado por la IA (Temperatura del lead)
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;

-- Assuming a `users` table or `auth.uid()` tenant architecture
-- CREATE POLICY "Users can view own company leads" ON crm_leads FOR SELECT USING (company_id = (SELECT company_id FROM users WHERE id = auth.uid()));
-- (Ajustar políticas basado en su arquitectura multi-tenant actual)

-- ==========================================
-- 2. AUDITORY & AI REPORTS
-- ==========================================
CREATE TABLE marketing_audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    audit_type TEXT NOT NULL, -- EJ: 'Meta Ads Analysis', 'Web Performance', 'Competitor Spy'
    target_url_or_name TEXT,
    json_result JSONB, -- The AI generated insights and breakdown effect analysis
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE marketing_audits ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 3. OMNICHANNEL MESSAGING (Antiban Meta API)
-- ==========================================
CREATE TABLE omnichannel_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    lead_id UUID REFERENCES crm_leads(id) ON DELETE SET NULL,
    platform TEXT NOT NULL, -- 'whatsapp', 'instagram', 'messenger'
    direction TEXT NOT NULL, -- 'inbound' (from lead), 'outbound' (from agent/AI)
    content TEXT,
    message_type TEXT DEFAULT 'text', -- 'text', 'image', 'video', 'template'
    is_ai_replied BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE omnichannel_messages ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 4. AI CREATIVES (Ad Library)
-- ==========================================
CREATE TABLE generated_creatives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    campaign_context TEXT,
    image_url TEXT,
    copy_text TEXT,
    hook_score INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE generated_creatives ENABLE ROW LEVEL SECURITY;
