import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { IQuoteWithMeta } from '../../../_shared/types/quotes.types';
import { useQuoteDetail } from '../../_hooks/useQuoteDetail';

interface SendQuoteProps {
  quote: IQuoteWithMeta;
  onBack: () => void;
}

export function SendQuoteModal({ quote, onBack }: SendQuoteProps) {
  const { handleSend } = useQuoteDetail(quote, onBack);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          className='border-emerald-400 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700'
        >
          <Send className='h-4 w-4 mr-1.5' />
          Enviar cotización
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Enviar cotización al cliente?</AlertDialogTitle>
          <AlertDialogDescription>
            Se enviará la cotización por correo electrónico. Una vez enviada, no
            podrás modificar su contenido.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleSend}>
            Enviar cotización
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
