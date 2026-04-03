import NDASignForm from './_components/NDASignForm'

interface Props {
  searchParams: Promise<{ firstName?: string; lastName?: string; email?: string }>
}

export default async function NDAPage({ searchParams }: Props) {
  const { firstName = '', lastName = '', email = '' } = await searchParams
  return <NDASignForm firstName={firstName} lastName={lastName} email={email} />
}
