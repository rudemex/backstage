/*
 * Copyright 2020 Spotify AB
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, { FC, useEffect, useState } from 'react';
import { useAsync } from 'react-use';
import ComponentMetadataCard from '../ComponentMetadataCard/ComponentMetadataCard';
import {
  Content,
  Header,
  pageTheme,
  Page,
  useApi,
  ErrorApi,
  errorApiRef,
} from '@backstage/core';
import ComponentContextMenu from '../ComponentContextMenu/ComponentContextMenu';
import ComponentRemovalDialog from '../ComponentRemovalDialog/ComponentRemovalDialog';
import { SentryIssuesWidget } from '@backstage/plugin-sentry';
import { Grid } from '@material-ui/core';
import { catalogApiRef } from '../..';
import { envelopeToComponent } from '../../data/utils';

const REDIRECT_DELAY = 1000;

type ComponentPageProps = {
  match: {
    params: {
      name: string;
    };
  };
  history: {
    push: (url: string) => void;
  };
};

const ComponentPage: FC<ComponentPageProps> = ({ match, history }) => {
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [removingPending, setRemovingPending] = useState(false);
  const showRemovalDialog = () => setConfirmationDialogOpen(true);
  const hideRemovalDialog = () => setConfirmationDialogOpen(false);
  const componentName = match.params.name;
  const errorApi = useApi<ErrorApi>(errorApiRef);

  if (componentName === '') {
    history.push('/catalog');
    return null;
  }

  const catalogApi = useApi(catalogApiRef);
  const catalogRequest = useAsync(() =>
    catalogApi.getEntityByName(match.params.name),
  );

  useEffect(() => {
    if (catalogRequest.error) {
      errorApi.post(new Error('Component not found!'));
      setTimeout(() => {
        history.push('/catalog');
      }, REDIRECT_DELAY);
    }
  }, [catalogRequest.error]);

  const removeComponent = async () => {
    setConfirmationDialogOpen(false);
    setRemovingPending(true);
    // await componentFactory.removeComponentByName(componentName);
    history.push('/catalog');
  };

  const component = envelopeToComponent(catalogRequest.value! ?? {});

  return (
    <Page theme={pageTheme.home}>
      <Header title={component.name || 'Catalog'}>
        <ComponentContextMenu onUnregisterComponent={showRemovalDialog} />
      </Header>
      {confirmationDialogOpen && catalogRequest.value && (
        <ComponentRemovalDialog
          component={component}
          onClose={hideRemovalDialog}
          onConfirm={removeComponent}
          onCancel={hideRemovalDialog}
        />
      )}
      <Content>
        <Grid container spacing={3} direction="column">
          <Grid item>
            <ComponentMetadataCard
              loading={catalogRequest.loading || removingPending}
              component={component}
            />
          </Grid>
          <Grid item>
            <SentryIssuesWidget
              sentryProjectId="sample-sentry-project-id"
              statsFor="24h"
            />
          </Grid>
        </Grid>
      </Content>
    </Page>
  );
};
export default ComponentPage;
