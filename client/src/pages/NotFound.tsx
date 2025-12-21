import { Button } from '@/components/ui/button';

const NotFound = () => {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-6 py-24 sm:py-32 lg:px-8">
      <div className="text-center space-y-6">
        <p className="text-base font-semibold text-primary">404</p>
        
        <h1 className="mt-4 text-5xl font-semibold tracking-tight text-balance sm:text-7xl text-foreground">
          Page not found
        </h1>
        
        <p className="mt-6 text-lg font-medium text-pretty text-muted-foreground sm:text-xl">
          Sorry, we couldn't find the page you're looking for.
        </p>
        
        <div className="mt-10 flex items-center justify-center gap-6">
          <Button
            asChild
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-200 rounded-lg font-semibold"
          >
            <a href="/">Go back home</a>
          </Button>
          
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-border text-foreground hover:bg-accent hover:text-accent-foreground rounded-lg font-medium"
          >
            <a href="/support">Contact support</a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;