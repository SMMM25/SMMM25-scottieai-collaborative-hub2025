
import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import IntegrationCards from '@/components/features/IntegrationCards';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

const IntegrationsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link to="/" className="flex items-center text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
        
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">AI Integrations</h1>
          <p className="text-muted-foreground mb-8">
            Enhance your projects with these powerful AI technologies and deployment options
          </p>
          
          <div className="relative mb-8">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search integrations..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Tabs defaultValue="all">
            <TabsList className="mb-8">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="ai">AI</TabsTrigger>
              <TabsTrigger value="frameworks">Frameworks</TabsTrigger>
              <TabsTrigger value="deployment">Deployment</TabsTrigger>
              <TabsTrigger value="tools">Tools</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              <IntegrationCards />
            </TabsContent>
            
            <TabsContent value="ai">
              <IntegrationCards filter={['AI']} />
            </TabsContent>
            
            <TabsContent value="frameworks">
              <IntegrationCards filter={['Framework']} />
            </TabsContent>
            
            <TabsContent value="deployment">
              <IntegrationCards filter={['Deployment']} />
            </TabsContent>
            
            <TabsContent value="tools">
              <IntegrationCards filter={['Tools']} />
            </TabsContent>
          </Tabs>
          
          <div className="mt-12 p-6 border border-dashed rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Need a custom integration?</h2>
            <p className="text-muted-foreground mb-4">
              We can help you integrate custom tools and technologies with your project.
            </p>
            <Button 
              className="bg-scottie hover:bg-scottie-secondary"
              asChild
            >
              <Link to="/docs">
                <span>Learn More</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationsPage;
