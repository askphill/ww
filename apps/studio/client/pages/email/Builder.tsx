import {useParams} from 'react-router-dom';
import {EmailBuilder} from '../../components/email-builder/EmailBuilder';

export function Builder() {
  const {id} = useParams();

  return <EmailBuilder templateId={id ? parseInt(id, 10) : undefined} />;
}
