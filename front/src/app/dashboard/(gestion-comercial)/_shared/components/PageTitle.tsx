export function PageTitle({
  userRole,
  title,
  description,
}: {
  userRole: 'admin' | 'usuario';
  title: string;
  description: string;
}) {
  return (
    <>
      <h1 className='text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold truncate'>
        {title}
      </h1>
      <p className='text-gray-600 mt-1 text-xs sm:text-sm'>
        {description}
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
