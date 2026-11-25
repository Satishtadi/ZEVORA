import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { corporateApi, operatorApi } from '@/services/api-services';

const COMPANY_KEY = 'zevora.companyId';
const OPERATOR_KEY = 'zevora.operatorId';

function readKey(key: string) {
  try {
    return localStorage.getItem(key) ?? '';
  } catch {
    return '';
  }
}

function writeKey(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable in private mode; selection still works per session.
  }
}

export function useSelectedCompany() {
  const companiesQuery = useQuery({
    queryKey: ['corporate', 'companies'],
    queryFn: corporateApi.companies,
  });
  const [companyId, setCompanyId] = useState(() => readKey(COMPANY_KEY));

  useEffect(() => {
    const list = companiesQuery.data ?? [];
    if (list.length === 0) return;
    if (!list.some((company) => company.id === companyId)) {
      const first = list[0].id;
      setCompanyId(first);
      writeKey(COMPANY_KEY, first);
    }
  }, [companiesQuery.data, companyId]);

  const selectCompany = (id: string) => {
    setCompanyId(id);
    writeKey(COMPANY_KEY, id);
  };

  return {
    companiesQuery,
    companies: companiesQuery.data ?? [],
    company: companiesQuery.data?.find((item) => item.id === companyId) ?? null,
    companyId,
    selectCompany,
  };
}

export function useSelectedOperator() {
  const operatorsQuery = useQuery({
    queryKey: ['operator', 'operators'],
    queryFn: operatorApi.operators,
  });
  const [operatorId, setOperatorId] = useState(() => readKey(OPERATOR_KEY));

  useEffect(() => {
    const list = operatorsQuery.data ?? [];
    if (list.length === 0) return;
    if (!list.some((operator) => operator.id === operatorId)) {
      const first = list[0].id;
      setOperatorId(first);
      writeKey(OPERATOR_KEY, first);
    }
  }, [operatorsQuery.data, operatorId]);

  const selectOperator = (id: string) => {
    setOperatorId(id);
    writeKey(OPERATOR_KEY, id);
  };

  return {
    operatorsQuery,
    operators: operatorsQuery.data ?? [],
    operator: operatorsQuery.data?.find((item) => item.id === operatorId) ?? null,
    operatorId,
    selectOperator,
  };
}
