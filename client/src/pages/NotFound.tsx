const NotFound = () => {
  return (
    <div className="grid min-h-full place-items-center absolute top-0 bottom-0 left-0 right-0 bg-base-bg px-6 py-24 sm:py-32 lg:px-8">
      <div className="text-center">
        <p className="text-base font-semibold text-primary-500">404</p>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight text-balance sm:text-7xl text-base-text">
          Page not found
        </h1>
        <p className="mt-6 text-lg font-medium text-pretty text-muted-text sm:text-xl/8">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <a
          
            href="/"
            className="px-4 py-2 rounded-xl font-semibold text-white bg-primary-500 hover:bg-primary-600 shadow-md hover:shadow-lg transition-all duration-200"
          >
            Go back home
          </a>
        </div>
      </div>
    </div>
  )
}

export default NotFound