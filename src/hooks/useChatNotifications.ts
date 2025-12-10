import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UseChatNotificationsOptions {
  userId?: string;
  userType: 'admin' | 'booster' | 'customer';
  enabled?: boolean;
}

export function useChatNotifications({ userId, userType, enabled = true }: UseChatNotificationsOptions) {
  useEffect(() => {
    if (!enabled || !userId) return;

    // Subscribe to new messages in job_communications
    const channel = supabase
      .channel('chat-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'job_communications',
        },
        async (payload) => {
          const newMessage = payload.new as any;
          
          // Don't notify for own messages
          if (userType === 'admin' && newMessage.sender_type === 'admin') return;
          if (userType === 'booster' && newMessage.sender_type === 'booster') return;
          if (userType === 'customer' && newMessage.sender_type === 'customer') return;
          
          // Get job details for context
          const { data: job } = await supabase
            .from('jobs')
            .select('title, client_name')
            .eq('id', newMessage.job_id)
            .single();
          
          const senderLabel = newMessage.sender_type === 'customer' 
            ? 'Kunde' 
            : newMessage.sender_type === 'booster' 
              ? 'Booster' 
              : 'Admin';
          
          const hasImage = !!newMessage.image_url;
          const messagePreview = hasImage 
            ? '📷 Sendte et billede' 
            : newMessage.message_text?.substring(0, 50) + (newMessage.message_text?.length > 50 ? '...' : '');
          
          toast.info(`Ny besked fra ${senderLabel}`, {
            description: job?.title 
              ? `${job.title}: ${messagePreview}`
              : messagePreview,
            duration: 5000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, userType, enabled]);
}
