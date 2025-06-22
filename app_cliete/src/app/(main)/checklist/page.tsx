"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ListChecks, PlusCircle, Trash2 } from "lucide-react";
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

const initialItems: ChecklistItem[] = [
  { id: '1', text: 'Pasaporte y Visas', completed: false },
  { id: '2', text: 'Billetes de Avión (Impresos/Digitales)', completed: false },
  { id: '3', text: 'Reservas de Hotel', completed: false },
  { id: '4', text: 'Detalles del Seguro de Viaje', completed: false },
  { id: '5', text: 'Cargadores para Electrónicos', completed: true },
];

export default function ChecklistPage() {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [newItemText, setNewItemText] = useState('');

  useEffect(() => {
    const storedItems = localStorage.getItem('travelChecklist');
    if (storedItems) {
      setItems(JSON.parse(storedItems));
    } else {
      setItems(initialItems);
    }
  }, []);

  useEffect(() => {
    if (items.length > 0 || localStorage.getItem('travelChecklist')) {
        localStorage.setItem('travelChecklist', JSON.stringify(items));
    }
  }, [items]);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemText.trim() === '') return;
    const newItem: ChecklistItem = {
      id: String(Date.now()),
      text: newItemText.trim(),
      completed: false,
    };
    setItems([...items, newItem]);
    setNewItemText('');
  };

  const toggleItemCompletion = (id: string) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const deleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };
  
  const completedCount = items.filter(item => item.completed).length;
  const totalCount = items.length;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
        <ListChecks className="mr-3 h-8 w-8 text-primary" /> Mi Checklist de Viaje
      </h2>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Empaca Inteligentemente, Viaja Mejor</CardTitle>
          {totalCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {completedCount} de {totalCount} artículos empacados.
            </p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddItem} className="flex items-center space-x-2 mb-6">
            <Input
              type="text"
              placeholder="Añadir nuevo artículo (ej. Protector solar)"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              className="flex-grow"
              aria-label="Nuevo artículo del checklist"
            />
            <Button type="submit" variant="default" className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <PlusCircle className="mr-2 h-4 w-4" /> Añadir
            </Button>
          </form>

          {items.length === 0 && (
             <p className="text-muted-foreground text-center py-4">Tu checklist está vacío. ¡Añade algunos artículos para empezar!</p>
          )}

          <ScrollArea className="h-[calc(100vh-450px)] md:h-[calc(100vh-400px)] pr-3">
            <ul className="space-y-3">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-card border rounded-md shadow-sm hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id={`item-${item.id}`}
                      checked={item.completed}
                      onCheckedChange={() => toggleItemCompletion(item.id)}
                      aria-labelledby={`label-item-${item.id}`}
                    />
                    <Label
                      htmlFor={`item-${item.id}`}
                      id={`label-item-${item.id}`}
                      className={`flex-grow cursor-pointer ${item.completed ? 'line-through text-muted-foreground' : ''}`}
                    >
                      {item.text}
                    </Label>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteItem(item.id)} aria-label={`Eliminar artículo: ${item.text}`}>
                    <Trash2 className="h-4 w-4 text-destructive/70 hover:text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
