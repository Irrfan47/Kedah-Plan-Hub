import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit3, Save, Eye } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ExcoUser {
  id: string;
  name: string;
  total_budget: number;
  remaining_budget: number;
  total_programs: number;
  pending_programs: number;
}

interface Props {
  users: ExcoUser[];
  userRole: string;
  onBudgetChange?: (userId: string, newBudget: number) => void;
  onViewUser?: (user: ExcoUser) => void;
  showViewButton?: boolean;
}

const ExcoUserBudgetTable: React.FC<Props> = ({ users, userRole, onBudgetChange, onViewUser, showViewButton }) => {
  const { t } = useLanguage();
  const [editBudgetId, setEditBudgetId] = useState<string | null>(null);
  const [budgetInput, setBudgetInput] = useState<{ [id: string]: string }>({});

  const handleEdit = (user: ExcoUser) => {
    setEditBudgetId(user.id);
    setBudgetInput((prev) => ({ ...prev, [user.id]: user.total_budget.toString() }));
  };

  const handleSave = (user: ExcoUser) => {
    if (onBudgetChange && budgetInput[user.id] !== undefined) {
      onBudgetChange(user.id, Number(budgetInput[user.id]));
    }
    setEditBudgetId(null);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('table.name')}</TableHead>
          <TableHead>{t('table.total_programs')}</TableHead>
          <TableHead>{t('table.pending_programs')}</TableHead>
          <TableHead>{t('table.total_budget')}</TableHead>
          <TableHead>{t('table.remaining_budget')}</TableHead>
          {showViewButton && <TableHead>{t('table.view')}</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>{user.name}</TableCell>
            <TableCell>{user.total_programs}</TableCell>
            <TableCell>{user.pending_programs}</TableCell>
            <TableCell>
              {userRole === 'finance_mmk' ? (
                editBudgetId === user.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={budgetInput[user.id] ?? ""}
                      min={0}
                      onChange={(e) => setBudgetInput((prev) => ({ ...prev, [user.id]: e.target.value }))}
                      className="w-24"
                    />
                    <Button size="sm" variant="outline" onClick={() => handleSave(user)}><Save className="h-4 w-4" /></Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>RM {(user.total_budget ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(user)}><Edit3 className="h-4 w-4" /></Button>
                  </div>
                )
              ) : (
                <span>RM {(user.total_budget ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              )}
            </TableCell>
            <TableCell>RM {(user.remaining_budget ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
            {showViewButton && (
              <TableCell>
                <Button size="sm" variant="outline" onClick={() => onViewUser && onViewUser(user)}>
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ExcoUserBudgetTable;