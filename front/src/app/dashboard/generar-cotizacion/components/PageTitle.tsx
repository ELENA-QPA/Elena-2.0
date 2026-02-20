export function PageTitle({ userRole }: { userRole: 'admin' | 'usuario' }) {
  return (
    <>
      <h1 className='text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold truncate'>
        Generar cotización
      </h1>
      <p className='text-gray-600 mt-1 text-xs sm:text-sm'>
        Generación de cotizaciones para el software Quanta
        <span className='ml-1 sm:ml-2 text-xs sm:text-sm'>
          • Rol:{' '}
          <span
            className={`font-medium ${
              userRole === 'admin' ? 'text-green-600' : 'text-blue-600'
            }`}
          >
            {userRole === 'admin' ? 'Admin' : 'Usuario'}
          </span>
        </span>
      </p>
    </>
  );
}
