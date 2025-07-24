import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DeliveryScheduleForm } from '@/components/delivery/DeliveryScheduleForm';
import { DeliveryScheduleList } from '@/components/delivery/DeliveryScheduleList';
import { CalendarPlus, List, Truck } from 'lucide-react';

export const DeliveryManagement = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Truck className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Delivery Management</h1>
      </div>
      
      <Tabs defaultValue="schedules" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="schedules" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Delivery Schedules
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <CalendarPlus className="h-4 w-4" />
            Schedule Delivery
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="schedules" className="space-y-4">
          <DeliveryScheduleList />
        </TabsContent>
        
        <TabsContent value="create" className="space-y-4">
          <DeliveryScheduleForm />
        </TabsContent>
      </Tabs>
    </div>
  );
};