import React from 'react';
import Container from '../components/ui/Container';
import Button from '../components/ui/Button';

const Box: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...rest }) => (
  <div className={["ui-card", className || ""].filter(Boolean).join(" ")} {...rest}>{children}</div>
);

const DesignSystem: React.FC = () => {
  return (
    <div className="py-8">
      <Container>
        <h1>Design System</h1>
        <p className="subtitle">Tokens, tipografía, componentes y layout unificados.</p>

        <section className="u-mb-6">
          <h2>Tipografía</h2>
          <Box>
            <h1>Encabezado H1</h1>
            <h2>Encabezado H2</h2>
            <h3>Encabezado H3</h3>
            <h4>Encabezado H4</h4>
            <h5>Encabezado H5</h5>
            <h6>Encabezado H6</h6>
            <p className="text-body">Texto cuerpo con jerarquía clara y legible.</p>
            <p className="subtitle">Subtítulo para secciones secundarias.</p>
          </Box>
        </section>

        <section className="u-mb-6">
          <h2>Botones</h2>
          <Box>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Button variant="primary">Primario</Button>
              <Button variant="secondary">Secundario</Button>
              <Button variant="action">Acción</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="primary" size="sm">Pequeño</Button>
              <Button variant="primary" size="lg">Grande</Button>
              <Button variant="primary" disabled>Disabled</Button>
              <Button variant="secondary" loading>Loading</Button>
            </div>
          </Box>
        </section>

        <section className="u-mb-6">
          <h2>Contenedores</h2>
          <Box>
            <p className="text-body">El componente Container ajusta el ancho máximo por breakpoint y aplica padding horizontal consistente.</p>
          </Box>
        </section>

        <section className="u-mb-6">
          <h2>Grid y Layout</h2>
          <Box>
            <div className="ui-grid ui-grid--responsive">
              <div className="ui-card">Item 1</div>
              <div className="ui-card">Item 2</div>
              <div className="ui-card">Item 3</div>
              <div className="ui-card">Item 4</div>
              <div className="ui-card">Item 5</div>
              <div className="ui-card">Item 6</div>
            </div>
          </Box>
        </section>

        {/* Chips */}
        <section className="u-mb-6">
          <h2>Chips</h2>
          <Box>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="chip chip--blue">Photoshop (Avanzado)</span>
              <span className="chip chip--green">Inglés (B2)</span>
              <span className="chip chip--purple">Figma (Intermedio)</span>
              <span className="chip chip--red">Python (Avanzado)</span>
              <span className="chip chip--yellow">SAP (Básico)</span>
            </div>
          </Box>
        </section>

        <section className="u-mb-6">
          <h2>Tokens y Variables CSS</h2>
          <Box>
            <p className="text-body">Modifica colores, tipografías, espaciado y sombras en <code>/styles/design-system.css</code> para actualizar toda la aplicación.</p>
          </Box>
        </section>
      </Container>
    </div>
  );
};

export default DesignSystem;