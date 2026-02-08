-- Create workspace ground tiles table
CREATE TABLE public.workspace_ground_tiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  grid_x INTEGER NOT NULL,
  grid_y INTEGER NOT NULL,
  tile_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_tile_position UNIQUE (workspace_id, grid_x, grid_y)
);

-- Create trigger for updated_at
CREATE TRIGGER update_workspace_ground_tiles_updated_at
  BEFORE UPDATE ON public.workspace_ground_tiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for efficient queries
CREATE INDEX idx_workspace_ground_tiles_workspace_id ON public.workspace_ground_tiles(workspace_id);
CREATE INDEX idx_workspace_ground_tiles_position ON public.workspace_ground_tiles(workspace_id, grid_x, grid_y);
