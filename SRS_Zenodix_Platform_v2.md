# Documento de Especificación de Requisitos de Software (SRS)
## Plataforma Zenodix Agency v2.0

### 1. Introducción
**Objetivo:** El propósito de este proyecto es desplegar la plataforma web corporativa de Zenodix Agency. Actúa como el principal embudo de conversión B2B, ofreciendo un cotizador interactivo ("App-Grid") y tres modalidades distintas de Inteligencia Artificial (Chatbots) para la calificación de leads, agendamiento de citas y levantamiento automatizado de requerimientos (SRS Generator).

**Alcance:** La plataforma soporta un entorno Multimodal, permitiendo a los usuarios subir imágenes o documentos a través de una UI limpia, para ser procesados mediante webhooks centralizados en n8n conectados a modelos de lenguaje grandes (LLMs), Voice AI, Supabase y Google Calendar.

---

### 2. Arquitectura del Sistema
La arquitectura sigue un enfoque **Jamstack / Serverless AI**, priorizando velocidad y modularidad:

*   **Front-End:** Construido en HTML5, CSS3 (Custom Variables) y Vanilla JavaScript (sin frameworks). Optimizado para el rendimiento con asincronía y carga dinámica.
*   **Back-End (Orquestador):** Plataforma n8n (`n8n Webhooks`). Recibe cargas útiles JSON (con soporte Base64 para archivos adjuntos), bifurca lógicas de negocio y conecta con las APIs finales (OpenAI, Anthropic, Vapi, ElevenLabs).
*   **Base de Datos (Roadmap):** PostgreSQL alojado en Supabase (Gestión de Leads, CRM B2B y Auditoría de Cotizaciones).
*   **Integración de Citas:** Google Calendar API.

---

### 3. Módulos y Funcionalidades Principales

#### 3.1. Cotizador Interactivo (App-Grid)
*   **Descripción:** Una matriz visual en formato "Cuadrícula de Apps" donde cada ícono despliega su panel de precios asociado de forma independiente (Single Page Application UX).
*   **Cálculo Dinámico:** Los usuarios seleccionan "Radio Buttons" y "Checkboxes" (Power-Ups) que alimentan un Carrito de Inversión estático a la derecha.
*   **Conversión Divisas:** Selector inteligente que convierte el monto base (COP) a USD, MXN, CLP y ARS, utilizando un multiplicador interno configurable.
*   **Call-to-Action:** El monto calculado genera automáticamente un enlace de WhatsApp parametrizado pre-llenado con el valor de inversión para un cierre táctil y rápido.

#### 3.2. Asistentes de IA Multimodal
La plataforma cuenta con 3 endpoints gráficos distintos en el UI, cada uno con funcionalidad específica:
1.  **Chat Flotante (Lead Gen):** Califica visitantes y agenda citas por WhatsApp.
2.  **Demo Interactiva (Middle Funnel):** Una interfaz expuesta donde el usuario interactúa demostrando las capacidades reales del Agente IA de Zenodix.
3.  **Generador SRS (Bottom Funnel):** Un levantador de requerimientos automatizado especializado en consultoría B2B.

**Capacidades Multimodales (Archivos & Voz):**
*   **Interfáz Gráfica:** Botones de Adjuntar (Clip) y Micrófono rediseñados usando componentes SVG.
*   **Procesamiento:** Función JavaScript [handleFileSelect()](file:///d:/Proyectos%20Antigravity/Pagina%20Web%20Zenodix/app.js#3-15) codifica nativamente archivos subidos por el cliente (Imágenes, PDFs) usando `FileReader.readAsDataURL()` para generar strings [Base64](file:///d:/Proyectos%20Antigravity/Pagina%20Web%20Zenodix/app.js#16-22) ligeros que se empaquetan dentro del Payload JSON hacia n8n.

---

### 4. Matriz de Servicios y Precios (Portafolio B2B)
El cotizador App-Grid procesa los siguientes módulos estructurales:

1.  **Landing Pages (Funnels):** `1 Landing ($80.000 COP)` hasta `Pack x100 Agency ($5.000.000 COP)`
2.  **Web Corporativa:** `Esencial ($500.000 COP)`, `Profesional` y `Élite`
3.  **E-commerce Pro:** `Starter ($1.200.000 COP)`, `Growth` y `Escala Custom`
4.  **Gestión de Redes IA:** Suscripciones mensuales `Content Starter`, `Growth B2B`, y `Authority Pro`
5.  **Voice AI & Agentes Telefónicos:** `Agente WhatsApp Async ($1.500.000 COP)`, `Agente Inbound` y `Call Center Outbound Pro`
6.  **Data Analytics & BI:** `Dashboard Esencial ($1.200.000 COP)`, `Power BI` y `Ecosistema Big Data`
7.  **Power-Ups (Adicionales Checkbox):** `IA Conversacional`, `IA Personal Shopper`, y `Automatización n8n`
8.  **Consultoría Logística:** Proyecto Evaluado a Medida Estratégica.

---

### 5. Roadmap de Siguientes Pasos
En las próximas semanas de desarrollo, el enfoque transicionará a la logística backend pura (Orquestación e Integraciones B2B):

1.  **Despliegue de Supabase:** Crear y vincular las tablas `Client Leads`, `Quotations`, y `Conversation History`. Reemplazar endpoints de almacenamiento temporales.
2.  **Ingesta RAG (Retrieval-Augmented Generation):** Poblar la memoria vectorial de n8n para que los agentes respondan con el portafolio documentado sin alucinaciones.
3.  **Implementación Voice AI Plena:** Pruebas beta de llamadas Outbound utilizando Vapi.ai y ElevenLabs en cuentas corporativas demo para el módulo de Call Center automático.
4.  **Calendar Sync:** Cerrar el trigger de n8n con el Oauth de Google Calendar para la reserva automática enviando un Zoom link a los Leads confirmados en el chat.
