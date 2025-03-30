
import React from 'react';
import { 
  Calendar, 
  Code2, 
  Package, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Share2,
  ExternalLink
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import DeploymentDialog from './DeploymentDialog';

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'in-progress' | 'completed' | 'deployed';
  progress: number;
  created: Date;
  updated: Date;
  technologies: string[];
  deploymentUrl?: string;
  deploymentPlatform?: 'vercel' | 'netlify' | 'aws-amplify' | 'github-pages';
}

interface ProjectCardProps {
  project: Project;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onDeploy: (id: string, url: string) => void;
  className?: string;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onEdit,
  onDelete,
  onDeploy,
  className = "",
}) => {
  const statusColors = {
    'in-progress': 'bg-yellow-500',
    'completed': 'bg-green-500',
    'deployed': 'bg-scottie'
  };

  const statusText = {
    'in-progress': 'In Progress',
    'completed': 'Completed',
    'deployed': 'Deployed'
  };

  const handleDeploymentComplete = (url: string) => {
    onDeploy(project.id, url);
  };

  // Platform icon mapping
  const getPlatformIcon = () => {
    switch (project.deploymentPlatform) {
      case 'vercel':
        return '▲ '; // Vercel triangle
      case 'netlify':
        return '● '; // Netlify dot
      case 'aws-amplify':
        return '☁️ '; // Cloud for AWS
      case 'github-pages':
        return '🔱 '; // GitHub icon alternative
      default:
        return '';
    }
  };

  return (
    <div className={`bg-card rounded-lg border shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 ${className}`}>
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <h3 className="font-medium text-lg">{project.name}</h3>
            <p className="text-muted-foreground text-sm mt-1">{project.description}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(project.id)}>
                <Edit className="mr-2 h-4 w-4" />
                <span>Edit</span>
              </DropdownMenuItem>
              {project.status === 'completed' && (
                <DropdownMenuItem asChild>
                  <DeploymentDialog
                    projectId={project.id}
                    projectName={project.name}
                    technologies={project.technologies}
                    onDeploymentComplete={handleDeploymentComplete}
                    trigger={
                      <div className="flex items-center w-full cursor-pointer px-2 py-1.5">
                        <Share2 className="mr-2 h-4 w-4" />
                        <span>Deploy</span>
                      </div>
                    }
                  />
                </DropdownMenuItem>
              )}
              {project.deploymentUrl && (
                <DropdownMenuItem>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  <a 
                    href={project.deploymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full"
                  >
                    View Deployment
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(project.id)}
                className="text-red-500 focus:text-red-500"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2" />
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="mr-2 h-4 w-4" />
              <span>Updated {formatDistanceToNow(project.updated, { addSuffix: true })}</span>
            </div>
            <Badge 
              className={`${statusColors[project.status]} hover:${statusColors[project.status]}`}
            >
              {project.deploymentPlatform && project.status === 'deployed' ? 
                `${getPlatformIcon()}${statusText[project.status]}` : 
                statusText[project.status]}
            </Badge>
          </div>

          <div className="flex items-center">
            <Code2 className="mr-2 h-4 w-4 text-muted-foreground" />
            <div className="flex flex-wrap gap-2">
              {project.technologies.map((tech, index) => (
                <Badge key={index} variant="outline" className="bg-scottie-light/20">
                  {tech}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {project.status === 'completed' && !project.deploymentUrl && (
          <DeploymentDialog
            projectId={project.id}
            projectName={project.name}
            technologies={project.technologies}
            onDeploymentComplete={handleDeploymentComplete}
          />
        )}
      </div>
    </div>
  );
};

export default ProjectCard;
