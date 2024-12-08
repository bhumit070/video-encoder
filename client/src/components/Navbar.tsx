const Navbar = () => {
  return (
    <nav className="bg-blue-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center h-16 items-center">
          <div className="flex space-x-4">
            <a
              href="#list"
              className="text-white hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium"
            >
              List Videos
            </a>
            <a
              href="#upload"
              className="text-white hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium"
            >
              Upload Video
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
