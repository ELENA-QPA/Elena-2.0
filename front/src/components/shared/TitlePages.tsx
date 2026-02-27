export function TitlePages({ displayNumber }: { displayNumber: number }) {
  return (
    <div className='min-w-0 flex-1'>
      <h1 className='text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold truncate'>
        Gestión de Cotizaciones
      </h1>
      <p className='text-muted-foreground mt-1 text-xs sm:text-sm'>
        Administra y consulta las cotizaciones generadas
        {displayNumber > 0 && (
          <span className='ml-1 text-gray-700'>
            ({displayNumber} registros)
          </span>
        )}
      </p>
    </div>
  );
}
