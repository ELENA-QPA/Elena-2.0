import { GenerateQuoteForm } from './components/GenerateQuoteForm';
import { PageTitle } from './components/PageTitle';

export default function GenerateQuote() {
  //Datos provisionales
  const userRole = 'admin';

  return (
    <main>
      <PageTitle userRole={userRole} />
      <GenerateQuoteForm />
    </main>
  );
}
