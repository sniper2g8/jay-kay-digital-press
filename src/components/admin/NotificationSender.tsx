interface NotificationSenderProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationSender = ({ isOpen, onClose }: NotificationSenderProps) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background p-6 rounded-lg max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Send Notification</h3>
        <p className="text-muted-foreground mb-4">Notification sender functionality will be implemented here.</p>
        <button 
          onClick={onClose}
          className="bg-primary text-primary-foreground px-4 py-2 rounded"
        >
          Close
        </button>
      </div>
    </div>
  );
};