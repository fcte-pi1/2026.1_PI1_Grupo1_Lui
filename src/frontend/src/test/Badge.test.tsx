import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../app/components/ui/badge';

describe('Badge', () => {
  it('renderiza com texto', () => {
    render(<Badge>Ativo</Badge>);
    expect(screen.getByText('Ativo')).toBeInTheDocument();
  });

  it('renderiza como span por padrão', () => {
    render(<Badge data-testid="badge">Teste</Badge>);
    const el = screen.getByTestId('badge');
    expect(el.tagName).toBe('SPAN');
  });

  it('variante default — sem classe destrutiva', () => {
    render(<Badge>Default</Badge>);
    const el = screen.getByText('Default');
    // Deve ter classes base, não destrutivas
    expect(el.className).toContain('inline-flex');
  });

  it('variante secondary', () => {
    render(<Badge variant="secondary">Secundário</Badge>);
    const el = screen.getByText('Secundário');
    expect(el.className).toContain('bg-secondary');
  });

  it('variante destructive', () => {
    render(<Badge variant="destructive">Erro</Badge>);
    const el = screen.getByText('Erro');
    expect(el.className).toContain('bg-destructive');
  });

  it('variante outline', () => {
    render(<Badge variant="outline">Outline</Badge>);
    const el = screen.getByText('Outline');
    // outline não tem bg-transparent explícito, mas não tem bg-primary/bg-secondary/bg-destructive
    expect(el.className).not.toContain('bg-primary');
    expect(el.className).not.toContain('bg-destructive');
  });

  it('aceita className customizado', () => {
    render(<Badge className="mt-4 ml-2">Custom</Badge>);
    const el = screen.getByText('Custom');
    expect(el.className).toContain('mt-4');
    expect(el.className).toContain('ml-2');
  });

  it('asChild renderiza Slot (filho direto)', () => {
    render(
      <Badge asChild>
        <a href="/link">Link Badge</a>
      </Badge>
    );
    const el = screen.getByText('Link Badge');
    expect(el.tagName).toBe('A');
    expect(el).toHaveAttribute('href', '/link');
  });

  it('data-slot="badge" presente', () => {
    render(<Badge data-testid="badge">Slot</Badge>);
    expect(screen.getByTestId('badge')).toHaveAttribute('data-slot', 'badge');
  });
});
