import { Hono } from 'hono';
import { HonoEnv } from '../index';

const widget = new Hono<HonoEnv>();

widget.get('/', (c) => {
  const frontendUrl = c.env.FRONTEND_URL;

  const widgetScript = `
(function() {
    const script = document.currentScript;
    const botId = script.getAttribute('data-bot-id');
    const frontendUrl = '${frontendUrl}';

    if (!botId) {
        console.error('ChatWidget: data-bot-id attribute is missing.');
        return;
    }

    const container = document.createElement('div');
    container.id = 'chat-widget-container';
    container.style.position = 'fixed';
    container.style.bottom = '20px';
    container.style.right = '20px';
    container.style.zIndex = '9999';
    container.style.width = '400px'; 
    container.style.height = '600px';
    container.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    container.style.borderRadius = '12px';
    container.style.overflow = 'hidden';
    container.style.display = 'block';

    const iframe = document.createElement('iframe');
    iframe.src = \`\${frontendUrl}/widget/\${botId}\`;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    
    container.appendChild(iframe);
    document.body.appendChild(container);
})();
  `;

  c.header('Content-Type', 'application/javascript');
  return c.text(widgetScript);
});

widget.get('/:botId', (c) => {
  return c.json({ botId: c.req.param('botId') }, 200);
});

export default widget;
