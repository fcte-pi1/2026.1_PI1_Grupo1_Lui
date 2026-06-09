import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction } from '../app/components/ui/card';

describe('Card', () => {
  it('renderiza com children', () => {
    render(<Card><p>Conteúdo do card</p></Card>);
    expect(screen.getByText('Conteúdo do card')).toBeInTheDocument();
  });

  it('data-slot="card" presente', () => {
    render(<Card data-testid="card" />);
    expect(screen.getByTestId('card')).toHaveAttribute('data-slot', 'card');
  });

  it('aceita className customizado', () => {
    render(<Card className="max-w-md shadow-lg" data-testid="card" />);
    const el = screen.getByTestId('card');
    expect(el.className).toContain('max-w-md');
    expect(el.className).toContain('shadow-lg');
  });

  it('classes base presentes', () => {
    render(<Card data-testid="card" />);
    const el = screen.getByTestId('card');
    expect(el.className).toContain('rounded-xl');
    expect(el.className).toContain('border');
  });
});

describe('CardHeader', () => {
  it('renderiza com children', () => {
    render(<CardHeader><span>Cabeçalho</span></CardHeader>);
    expect(screen.getByText('Cabeçalho')).toBeInTheDocument();
  });

  it('data-slot="card-header" presente', () => {
    render(<CardHeader data-testid="header" />);
    expect(screen.getByTestId('header')).toHaveAttribute('data-slot', 'card-header');
  });

  it('aceita className customizado', () => {
    render(<CardHeader className="pb-0" data-testid="header" />);
    expect(screen.getByTestId('header').className).toContain('pb-0');
  });
});

describe('CardTitle', () => {
  it('renderiza como h4 com texto', () => {
    render(<CardTitle>Título do Card</CardTitle>);
    const el = screen.getByText('Título do Card');
    expect(el.tagName).toBe('H4');
  });

  it('classes base de título', () => {
    render(<CardTitle data-testid="title" />);
    expect(screen.getByTestId('title').className).toContain('leading-none');
  });
});

describe('CardDescription', () => {
  it('renderiza como p com texto', () => {
    render(<CardDescription>Descrição</CardDescription>);
    const el = screen.getByText('Descrição');
    expect(el.tagName).toBe('P');
  });
});

describe('CardContent', () => {
  it('renderiza com children', () => {
    render(<CardContent>Corpo</CardContent>);
    expect(screen.getByText('Corpo')).toBeInTheDocument();
  });

  it('data-slot="card-content" presente', () => {
    render(<CardContent data-testid="content" />);
    expect(screen.getByTestId('content')).toHaveAttribute('data-slot', 'card-content');
  });
});

describe('CardFooter', () => {
  it('renderiza com children', () => {
    render(<CardFooter>Rodapé</CardFooter>);
    expect(screen.getByText('Rodapé')).toBeInTheDocument();
  });

  it('data-slot="card-footer" presente', () => {
    render(<CardFooter data-testid="footer" />);
    expect(screen.getByTestId('footer')).toHaveAttribute('data-slot', 'card-footer');
  });
});

describe('CardAction', () => {
  it('renderiza como div com children', () => {
    render(<CardAction><button>Ação</button></CardAction>);
    expect(screen.getByText('Ação')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});

describe('Card — composição completa', () => {
  it('renderiza estrutura completa sem quebrar', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Título</CardTitle>
          <CardDescription>Subtítulo descritivo</CardDescription>
          <CardAction>
            <button>Editar</button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <p>Conteúdo principal do card.</p>
        </CardContent>
        <CardFooter>
          <span>Atualizado há 5 min</span>
        </CardFooter>
      </Card>
    );

    expect(screen.getByText('Título')).toBeInTheDocument();
    expect(screen.getByText('Subtítulo descritivo')).toBeInTheDocument();
    expect(screen.getByText('Conteúdo principal do card.')).toBeInTheDocument();
    expect(screen.getByText('Atualizado há 5 min')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
  });
});
