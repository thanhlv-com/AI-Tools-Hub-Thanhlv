import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ConfigProvider } from "@/contexts/ConfigContext";
import "./i18n";
import DDLCompare from "./pages/DDLCompare";
import Translation from "./pages/Translation";
import PromptGeneration from "./pages/PromptGeneration";
import CapacityAnalysis from "./pages/CapacityAnalysis";
import Diagram from "./pages/Diagram";
import WikiGeneration from "./pages/WikiGeneration";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ConfigProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<DDLCompare />} />
              <Route path="/translation" element={<Translation />} />
              <Route path="/prompt-generation" element={<PromptGeneration />} />
              <Route path="/capacity-analysis" element={<CapacityAnalysis />} />
              <Route path="/diagram" element={<Diagram />} />
              <Route path="/wiki-generation" element={<WikiGeneration />} />
              <Route path="/settings" element={<Settings />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </HashRouter>
      </TooltipProvider>
    </ConfigProvider>
  </QueryClientProvider>
);

export default App;
