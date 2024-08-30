/*
 * Copyright 2020 The Backstage Authors
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


import { Table, TableColumn, Progress } from '@backstage/core-components';
import React from 'react';
import useAsync from 'react-use/lib/useAsync';
import Alert from '@material-ui/lab/Alert';
import { useApi, configApiRef } from '@backstage/core-plugin-api';
import { useEntity } from '@backstage/plugin-catalog-react';
import { Chip, Box } from '@material-ui/core';
import FolderOpenIcon from '@material-ui/icons/FolderOpenOutlined';
import { AZURE_ANNOTATION_TAG_SELECTOR } from '../entityData';

type EntityResources = {
    id?: string;
    tenantId?: string;
    subscriptionId: string;
    name: string;
    tags?: any;
    type: string,
    resourceGroupId?: any,
    resourceGroup?: any;
};

type DenseTableProps = {
    rs: EntityResources[];
};


export const DenseTable = ({ rs: rs }: DenseTableProps) => {

  const columns: TableColumn[] = [
    { title: 'Id', field: 'id', hidden: true },
    { title: 'TenantId', field: 'tenantId', hidden: true },
    { title: 'Resource Group', field: 'resourceGroup' },
    { title: 'Name', field: 'name' },
    { title: 'Type', field: 'type' },
    { title: 'Tags', field: 'tags' }
  ];

  const data = rs.map(r => {
    const tags = [];
    for (const t in r.tags) {
        if (Object.prototype.hasOwnProperty.call(r.tags, t)) {
            const label = `${t}: ${r.tags[t]}`;
            const tagLink = `https://portal.azure.com/#blade/HubsExtension/BrowseResourcesWithTag/tagName/${t}/tagValue/${encodeURIComponent(r.tags[t])}`;
            tags.push(<Chip component="a" target="_blank" href={tagLink} label={label} variant='outlined' clickable size='small' />);
        }
    }
    return {
        resourceGroup: <a target="_blank" href={`https://portal.azure.com/#@${r.tenantId}/resource/subscriptions/${r.subscriptionId}/resourceGroups/${r.resourceGroup}`}>{r.resourceGroup}</a>,
        name:<a target="_blank" href={`https://portal.azure.com/#@${r.tenantId}/resource${r.id}`}>{r.name}</a>,
        type: r.type,
        tags: tags,
        id: r.id
    };
});

  return (
    <Table
      title={
        <Box display="flex" alignItems="center">
          <FolderOpenIcon style={{ fontSize: 30 }} />
        <Box mr={1} />
            Related resources
        </Box>
      }
      options={{ search: false, paging: true, pageSize: 10 }}
      columns={columns}
      data={data}
    />
  );
};

export const GetEntityAzureResourceGroups = () => {

  const { entity } = useEntity();
  const [tagKey, tagValue] = (
    entity?.metadata.annotations?.[AZURE_ANNOTATION_TAG_SELECTOR] ?? '/'
  ).split('/');
  
  console.log(`tag is ${tagKey}, tag value is ${tagValue} ` );
  
  const config = useApi(configApiRef);
  const backendUrl = config.getString('backend.baseUrl');
  const { value, loading, error } = useAsync(async (): Promise<EntityResources[]> => {
      const response = await fetch(`${backendUrl}/api/azure-resources/rg/${tagKey}/${tagValue}`);
      const json = await response.json();
      return json.data;
  }, []);

    if (loading) {
        return <Progress />;
      } else if (error) {
        return <Alert severity="error">{error.message}</Alert>;
      }
    return <DenseTable rs={value || []} />;
};
