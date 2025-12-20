import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="bg-elevated-bg border-t border-muted-bg mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-24">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
          <div className="text-muted-text text-sm">
            © {new Date().getFullYear()} HitWicket. All rights reserved.
          </div>
          <div className="flex items-center space-x-4 text-muted-text text-sm">
            <Link
              to="/privacy"
              className="hover:text-base-text transition-colors duration-200"
            >
              Privacy
            </Link>
            <span className="text-subtle-text">•</span>
            <Link
              to="/terms"
              className="hover:text-base-text transition-colors duration-200"
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