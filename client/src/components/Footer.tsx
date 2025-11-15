import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-gray-900 to-gray-800 border-t border-gray-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-24">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
          <div className="text-gray-400 text-sm">
            © {new Date().getFullYear()} HitWicket. All rights reserved.
          </div>
          <div className="flex items-center space-x-4 text-gray-400 text-sm">
            <Link
              to="/privacy"
              className="hover:text-white transition-colors duration-200"
            >
              Privacy
            </Link>
            <span className="text-gray-600">•</span>
            <Link
              to="/terms"
              className="hover:text-white transition-colors duration-200"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer