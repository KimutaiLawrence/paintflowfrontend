import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { DailySubmission } from '@/lib/types';
import { format } from 'date-fns';

interface DailySubmissionsViewerProps {
  submissions: DailySubmission[];
}

export function DailySubmissionsViewer({ submissions }: DailySubmissionsViewerProps) {
  if (submissions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No daily submissions have been made for this area yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Submissions</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {submissions.map((submission) => (
            <AccordionItem value={submission.id} key={submission.id}>
              <AccordionTrigger>
                Submission for {format(new Date(submission.submitted_at), 'PPP')} by {submission.submitted_by.full_name}
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {submission.documents.map((doc) => (
                    <a key={doc.id} href={doc.cloudinary_url} target="_blank" rel="noopener noreferrer">
                      <img src={doc.thumbnail_url || doc.cloudinary_url} alt={doc.original_file_name} className="rounded-lg" />
                      <p className="text-sm text-center mt-1">{doc.original_file_name}</p>
                    </a>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
