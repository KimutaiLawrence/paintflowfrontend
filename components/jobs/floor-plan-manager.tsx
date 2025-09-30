import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Upload } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { areasApi } from '@/lib/api';
import { FloorPlan } from '@/lib/types';

interface FloorPlanManagerProps {
  areaId: string;
  floorPlans: FloorPlan[];
}

export function FloorPlanManager({ areaId, floorPlans }: FloorPlanManagerProps) {
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<File[]>([]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles) => setFiles(acceptedFiles),
    accept: { 'image/*': ['.jpeg', '.png', '.jpg'] },
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => areasApi.uploadFloorPlan(areaId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floorPlans', areaId] });
      setFiles([]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (planId: string) => areasApi.deleteFloorPlan(areaId, planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floorPlans', areaId] });
    },
  });

  const handleUpload = () => {
    files.forEach((file) => uploadMutation.mutate(file));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Floor Plans</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div {...getRootProps()} className="border-2 border-dashed border-gray-300 p-6 text-center rounded-lg cursor-pointer">
            <input {...getInputProps()} />
            <Upload className="mx-auto h-8 w-8 text-gray-400" />
            <p>Drag 'n' drop some files here, or click to select files</p>
          </div>
          {files.length > 0 && (
            <div>
              <h4>Selected files:</h4>
              <ul>
                {files.map((file) => (
                  <li key={file.name}>{file.name}</li>
                ))}
              </ul>
              <Button onClick={handleUpload} disabled={uploadMutation.isPending} className="mt-2">
                {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          )}
          <div className="mt-4 grid grid-cols-2 gap-4">
            {floorPlans.map((plan) => (
              <div key={plan.id} className="relative">
                <img src={plan.url} alt="Floor plan" className="rounded-lg" />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={() => deleteMutation.mutate(plan.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
