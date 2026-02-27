import { getUiState } from '@bearstudio/ui-state';
import { ORPCError } from '@orpc/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircleIcon, PencilLineIcon, Trash2Icon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { orpc } from '@/lib/orpc/client';
import { useNavigateBack } from '@/hooks/use-navigate-back';

import { BackButton } from '@/components/back-button';
import { PageError } from '@/components/errors/page-error';
import { ButtonLink } from '@/components/ui/button-link';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmResponsiveDrawer } from '@/components/ui/confirm-responsive-drawer';
import { ResponsiveIconButton } from '@/components/ui/responsive-icon-button';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';

import { WithPermissions } from '@/features/auth/with-permission';
import { BookCover } from '@/features/book/book-cover';
import {
  PageLayout,
  PageLayoutContent,
  PageLayoutTopBar,
  PageLayoutTopBarTitle,
} from '@/layout/manager/page-layout';
import { Button } from '@/components/ui/button';
//My imports
import React from 'react';
import { Input } from '@/components/ui/input';
import { useLocalStorageState } from '@/hooks/use-local-storage';

export const PageBook = (props: { params: { id: string } }) => {
  const { t } = useTranslation(['book']);
  const queryClient = useQueryClient();
  const { navigateBack } = useNavigateBack();
  const bookQuery = useQuery(
    orpc.book.getById.queryOptions({ input: { id: props.params.id } })
  );

  const ui = getUiState((set) => {
    if (bookQuery.status === 'pending') return set('pending');
    if (
      bookQuery.status === 'error' &&
      bookQuery.error instanceof ORPCError &&
      bookQuery.error.code === 'NOT_FOUND'
    )
      return set('not-found');
    if (bookQuery.status === 'error') return set('error');
    return set('default', { book: bookQuery.data });
  });

  const deleteBook = async () => {
    try {
      await orpc.book.deleteById.call({ id: props.params.id });
      await Promise.all([
        // Invalidate books list
        queryClient.invalidateQueries({
          queryKey: orpc.book.getAll.key(),
          type: 'all',
        }),
        // Remove user from cache
        queryClient.removeQueries({
          queryKey: orpc.book.getById.key({ input: { id: props.params.id } }),
        }),
      ]);

      toast.success(t('book:manager.detail.deleted'));

      // Redirect
      navigateBack();
    } catch {
      toast.error(t('book:manager.detail.deleteError'));
    }
  };

  //Start of my code
  const storageKey = `book-review-${props.params.id}`;
  const [review, setReview] = useLocalStorageState(
    `book-review-${props.params.id}`,
    ''
  );
  React.useEffect(() => {
    window.localStorage.setItem(storageKey, review);
  }, [review, storageKey]);

  const MAX_CHARS = 200;
  const charactersLeft = MAX_CHARS - review.length;
  const isOverLimit = charactersLeft < 0;
  //End of my code

  return (
    <PageLayout>
      <PageLayoutTopBar
        startActions={<BackButton />}
        endActions={
          <>
            <WithPermissions
              permissions={[
                {
                  book: ['delete'],
                },
              ]}
            >
              <ConfirmResponsiveDrawer
                onConfirm={() => deleteBook()}
                title={t('book:manager.detail.confirmDeleteTitle', {
                  title: bookQuery.data?.title ?? '--',
                })}
                description={t('book:manager.detail.confirmDeleteDescription')}
                confirmText={t('book:manager.detail.deleteButton.label')}
                confirmVariant="destructive"
              >
                <ResponsiveIconButton
                  variant="ghost"
                  label={t('book:manager.detail.deleteButton.label')}
                  size="sm"
                >
                  <Trash2Icon />
                </ResponsiveIconButton>
              </ConfirmResponsiveDrawer>
            </WithPermissions>
            <ButtonLink
              size="sm"
              variant="secondary"
              to="/manager/books/$id/update"
              params={{ id: props.params.id }}
            >
              <PencilLineIcon />
              {t('book:manager.detail.editButton.label')}
            </ButtonLink>
          </>
        }
      >
        <PageLayoutTopBarTitle>
          {ui
            .match('pending', () => <Skeleton className="h-4 w-48" />)
            .match(['not-found', 'error'], () => (
              <AlertCircleIcon className="size-4 text-muted-foreground" />
            ))
            .match('default', ({ book }) => (
              <>
                {book.title} - {book.author} : {book.genre?.name}
              </>
            ))
            .exhaustive()}
        </PageLayoutTopBarTitle>
      </PageLayoutTopBar>
      <PageLayoutContent>
        {ui
          .match('pending', () => <Spinner full />)
          .match('not-found', () => <PageError type="404" />)
          .match('error', () => <PageError type="unknown-server-error" />)
          .match('default', ({ book }) => (
            <div className="flex flex-col gap-4 xs:flex-row">
              <div className="flex-2">
                <Card className="py-1">
                  <CardContent>
                    <dl className="flex flex-col divide-y text-sm">
                      <div className="flex gap-4 py-3">
                        <dt className="w-24 flex-none font-medium text-muted-foreground">
                          {t('book:common.title.label')}
                        </dt>
                        <dd className="flex-1">{book.title}</dd>
                      </div>
                      <div className="flex gap-4 py-3">
                        <dt className="w-24 flex-none font-medium text-muted-foreground">
                          {t('book:common.author.label')}
                        </dt>
                        <dd className="flex-1">{book.author}</dd>
                      </div>
                      <div className="flex gap-4 py-3">
                        <dt className="w-24 flex-none font-medium text-muted-foreground">
                          {t('book:common.genre.label')}
                        </dt>
                        <dd className="flex-1">{book.genre?.name}</dd>
                      </div>
                      <div className="flex gap-4 py-3">
                        <dt className="w-24 flex-none font-medium text-muted-foreground">
                          {t('book:common.publisher.label')}
                        </dt>
                        <dd className="flex-1">{book.publisher}</dd>
                      </div>
                      <div className="flex flex-col gap-2 py-3">
                        <dt className="w-24 flex-none font-medium text-muted-foreground">
                          {'Écrire un avis'}
                        </dt>
                        <dd className="flex flex-1 flex-col gap-2">
                          <Input
                            placeholder="Votre avis..."
                            value={review}
                            onChange={(e) => setReview(e.target.value)}
                            className={isOverLimit ? 'border-destructive' : ''} //red border is overflow
                          />
                          <div className="mt-1 flex items-center justify-between">
                            <p
                              className={`text-xs ${isOverLimit ? 'font-bold text-destructive' : 'text-muted-foreground'}`}
                            >
                              {isOverLimit
                                ? `Limite dépassée de ${Math.abs(charactersLeft)} caractères`
                                : `${charactersLeft} caractères restants`}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="xs"
                              variant="secondary"
                              onClick={() =>
                                isOverLimit
                                  ? toast.error('Trop long!')
                                  : toast.success(
                                      'Avis sauvegardé dans le navigateur !'
                                    )
                              }
                            >
                              Valider
                            </Button>
                            <Button
                              size="xs"
                              variant="ghost"
                              onClick={() => setReview('')}
                            >
                              Effacer
                            </Button>
                          </div>
                        </dd>
                      </div>
                      <div className="flex gap-4 py-3">
                        <dt className="w-24 flex-none font-medium text-muted-foreground">
                          {'Mon avis (Brouillon)'}
                        </dt>
                        <dd className="flex-1 text-muted-foreground italic">
                          {review || 'Aucun avis en cours de rédaction.'}
                        </dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              </div>
              <div
                aria-hidden
                className="mx-auto w-full max-w-64 min-w-48 flex-1"
              >
                <BookCover book={book} />
              </div>
            </div>
          ))
          .exhaustive()}
      </PageLayoutContent>
    </PageLayout>
  );
};
