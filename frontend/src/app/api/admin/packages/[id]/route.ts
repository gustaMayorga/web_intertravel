import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    console.log(`🗑️ DELETE /api/admin/packages/${id} - Eliminando paquete`);

    // Simular eliminación exitosa
    console.log(`✅ Paquete ${id} eliminado exitosamente (simulado)`);

    return NextResponse.json({
      success: true,
      message: `Paquete ${id} eliminado exitosamente`,
      source: 'mock'
    });

  } catch (error: any) {
    console.error('❌ Error eliminando paquete:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error al eliminar paquete',
      details: error.message
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    console.log(`✏️ PUT /api/admin/packages/${id} - Actualizando paquete:`, body);

    // Simular actualización exitosa
    const updatedPackage = {
      id: parseInt(id),
      ...body,
      updatedAt: new Date().toISOString()
    };

    console.log(`✅ Paquete ${id} actualizado exitosamente`);

    return NextResponse.json({
      success: true,
      data: updatedPackage,
      message: `Paquete ${id} actualizado exitosamente`,
      source: 'mock'
    });

  } catch (error: any) {
    console.error('❌ Error actualizando paquete:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error al actualizar paquete',
      details: error.message
    }, { status: 500 });
  }
}
