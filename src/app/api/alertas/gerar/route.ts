// src/app/api/alertas/gerar/route.ts
import { NextResponse } from 'next/server';
import { GeradorAlertas } from '@/lib/gerador-alertas';

export async function POST() {
  try {
    const gerador = new GeradorAlertas();
    await gerador.gerarTodosAlertas();

    return NextResponse.json({ 
      success: true, 
      message: 'Alertas gerados com sucesso' 
    });
  } catch (error) {
    console.error('Erro ao gerar alertas:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao gerar alertas' },
      { status: 500 }
    );
  }
}