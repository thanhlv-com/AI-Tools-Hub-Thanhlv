import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, AlertCircle } from "lucide-react";

const NotFound = () => {
  const { t } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md shadow-card">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-4xl font-bold">404</CardTitle>
          <CardDescription className="text-lg">
            {t('notFound.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            {t('notFound.pathNotFound', { path: location.pathname })}
          </p>
          <Link to="/">
            <Button className="bg-gradient-to-r from-primary to-primary-glow">
              <Home className="w-4 h-4 mr-2" />
              {t('notFound.backHome')}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
