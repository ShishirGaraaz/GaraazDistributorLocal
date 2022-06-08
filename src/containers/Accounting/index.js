import React, { useMemo, useState, useRef, useEffect } from 'react';
import DynamicTable from '../../components/DynamicTable';
import { useIntl } from 'react-intl';
import {
  Box,
  Button,
  Link,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Badge,
} from '@chakra-ui/react';
import ModifiedTableTop from '../../components/TableTop/ModifiedTableTop';
import readXlsxFile from 'read-excel-file';
import { getQueuedFiles, getAllAccounts, selectAccounts } from './slice';
import { useSelector, useDispatch } from 'react-redux';
import moment from 'moment';
import {
  useRouteMatch,
  Switch,
  Route,
  Link as ReactLink,
  useHistory,
} from 'react-router-dom';
import WorkshopAcct from './WorkShopAccount';
import withToast from '../../HOCs/withToast';
import messages from './messages';
import getMoneyFormat from '../../utils/getMoneyFormat';
import AccountBulk from '../../components/AccountBulk/Loadable';
import enums from '../../utils/enums';
import SimpleModal from '../../components/Modal';
import { selectGlobalState } from '../../globalSlice';

const Accounts = ({ notification }) => {
  const [inputValues, setInputValue] = useState({
    end: moment().add(1, 'days').format('YYYY-MM-DD'),
    start: moment().startOf('month').format('YYYY-MM-DD'),
  });
  const intl = useIntl();
  const [isLoading, setIsLoading] = useState(false);
  const auth = useSelector((state) => state.auth);
  const { allAccounts, queuedFile } = useSelector(selectAccounts);
  const dispatcher = useDispatch();
  const { url, path } = useRouteMatch();
  const [tableLoading, setTableLoading] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [fileQueueLoading, setFileQueueLoading] = useState(false);
  const [openCommentModal, setOpenCommentModal] = useState({
    isOpen: false,
    comment: '',
  });
  const { isDistributor } = useSelector(selectGlobalState);
  const history = useHistory();

  useEffect(() => {
    (async () => {
      setTableLoading(true);
      await dispatcher(getAllAccounts({ auth, params: {} }));
      setTableLoading(false);
      setFileQueueLoading(true);
      dispatcher(getQueuedFiles({ auth }));
      setFileQueueLoading(false);
    })();
  }, []);

  useEffect(() => {
    setTableData(allAccounts);
  }, [allAccounts]);

  const inputData = useMemo(
    () => [
      {
        title: intl.formatMessage(messages.accountDetailSearch),
        type: 'text',
        placeholder: '',
        name: 'searchAccount',
      },
      {
        title: intl.formatMessage(messages.groupBy),
        type: 'select',
        placeholder: 'Select option',
        name: 'groupBy',
        options: [
          {
            value: 'none',
            label: 'None',
          },
          {
            value: 'branch',
            label: intl.formatMessage(messages.branch),
          },
          {
            value: 'salesRep',
            label: intl.formatMessage(messages.salesRep),
          },
          {
            value: 'workshopType',
            label: intl.formatMessage(messages.workshopType),
          },
        ],
      },
      {
        title: intl.formatMessage(messages.date),
        type: 'date',
        placeholder: 'Enter order No',
        name: ['start', 'end'],
        defaultValue: [
          moment().startOf('month').format('YYYY-MM-DD'),
          moment().format('YYYY-MM-DD'),
        ],
      },
    ],
    [],
  );

  const queueFileColumn = useMemo(
    () => [
      {
        Header: intl.formatMessage(messages.sNo),
        accessor: 'sno',
        Cell: (allData) => {
          return <Box>{allData?.row?.index + 1}</Box>;
        },
      },
      {
        Header: intl.formatMessage(messages.mediaId),
        accessor: 'media',
        Cell: ({ value }) => {
          return (
            <Link href={value?.path} target='_blank'>
              Download File
            </Link>
          );
        },
      },
      {
        Header: intl.formatMessage(messages.dateAndTime),
        accessor: 'createdAt',
        Cell: ({ value }) => moment(value).format('DD/MM/YYYY h:mm:ss a'),
      },
      {
        Header: intl.formatMessage(messages.status),
        accessor: 'status',
        Cell: ({ value }) => {
          return value === enums.PENDING ? (
            <Badge colorScheme='yellow'>
              {intl.formatMessage(messages.pendingStatus)}
            </Badge>
          ) : value === enums.COMPLETED ? (
            <Badge colorScheme='green'>
              {intl.formatMessage(messages.completedStatus)}
            </Badge>
          ) : (
            <Badge colorScheme='orange'>{value.replace(/_/g, ' ')}</Badge>
          );
        },
      },
      {
        Header: 'comments',
        accessor: 'comments',
        Cell: ({ value }) => (
          <Button
            onClick={() =>
              setOpenCommentModal({
                isOpen: true,
                comment: value ?? 'No Comment',
              })
            }
            variant='ghost'
          >
            View Comment
          </Button>
        ),
      },
    ],
    [],
  );
  const columns = useMemo(
    () => [
      {
        Header: intl.formatMessage(messages.sNo),
        accessor: 'sno',
        Cell: (allData) => {
          return <Box>{allData?.row?.index + 1}</Box>;
        },
      },
      {
        Header: intl.formatMessage(messages.workshopName),
        accessor: 'workshopName',
        Cell: (allData) => {
          return (
            <Link
              as={ReactLink}
              to={`${url}/${allData.row.original.workshopId}/acounts`}
            >
              {allData.value}
            </Link>
          );
        },
      },
      {
        Header: 'Workshop Code',
        accessor: 'code',
      },
      {
        Header: intl.formatMessage(messages.workshopType),
        accessor: 'workshopType',
      },
      {
        Header: intl.formatMessage(messages.branch),
        accessor: 'branch',
      },
      {
        Header: intl.formatMessage(messages.salesRep),
        accessor: 'salesRep',
      },
      {
        Header: intl.formatMessage(messages.totalDebit),
        accessor: 'debit',
        Cell: ({ value }) => getMoneyFormat(value),
      },
      {
        Header: intl.formatMessage(messages.totalCredit),
        accessor: 'credit',
        Cell: ({ value }) => getMoneyFormat(value),
      },
    ],
    [],
  );

  const groupedByBranchColumn = useMemo(
    () => [
      {
        Header: intl.formatMessage(messages.sNo),
        accessor: 'sno',
        Cell: (allData) => {
          return <Box>{allData?.row?.index + 1}</Box>;
        },
      },
      {
        Header: intl.formatMessage(messages.branchName),
        accessor: 'branchName',
      },
      {
        Header: intl.formatMessage(messages.totalCustomer),
        accessor: 'customers',
        Cell: ({ value }) => {
          return <Box>{value?.length}</Box>;
        },
      },
      {
        Header: intl.formatMessage(messages.totalDebit),
        accessor: 'debit',
        Cell: ({ value }) => getMoneyFormat(value),
      },
      {
        Header: intl.formatMessage(messages.totalCredit),
        accessor: 'credit',
        Cell: ({ value }) => getMoneyFormat(value),
      },
    ],
    [],
  );

  const groupedBySalesColumn = useMemo(
    () => [
      {
        Header: intl.formatMessage(messages.sNo),
        accessor: 'sno',
        Cell: (allData) => {
          return <Box>{allData?.row?.index + 1}</Box>;
        },
      },
      {
        Header: intl.formatMessage(messages.salesRep),
        accessor: 'salesRep',
      },
      {
        Header: intl.formatMessage(messages.totalCustomer),
        accessor: 'customers',
        Cell: ({ value }) => {
          return <Box>{value?.length}</Box>;
        },
      },
      {
        Header: intl.formatMessage(messages.totalDebit),
        accessor: 'debit',
        Cell: ({ value }) => getMoneyFormat(value),
      },
      {
        Header: intl.formatMessage(messages.totalCredit),
        accessor: 'credit',
        Cell: ({ value }) => getMoneyFormat(value),
      },
    ],
    [],
  );
  const groupedByCustomerColumn = useMemo(
    () => [
      {
        Header: intl.formatMessage(messages.sNo),
        accessor: 'sno',
        Cell: (allData) => {
          return <Box>{allData?.row?.index + 1}</Box>;
        },
      },
      {
        Header: intl.formatMessage(messages.workshopType),
        accessor: 'workshopType',
      },
      {
        Header: intl.formatMessage(messages.totalCustomer),
        accessor: 'customers',
        Cell: ({ value }) => {
          return <Box>{value?.length}</Box>;
        },
      },
      {
        Header: intl.formatMessage(messages.totalDebit),
        accessor: 'debit',
        Cell: ({ value }) => getMoneyFormat(value),
      },
      {
        Header: intl.formatMessage(messages.totalCredit),
        accessor: 'credit',
        Cell: ({ value }) => getMoneyFormat(value),
      },
    ],
    [],
  );

  const handleTableTopChange = async (e, name) => {
    setTableLoading(true);
    let value = e.hasOwnProperty('target')
      ? `${e.target.value}`.trim()
      : `${e.value}`.trim();

    if (name === 'searchAccount') {
      setTableData(
        [...allAccounts].filter((account) => {
          return (
            `${account.code}`.toLowerCase().indexOf(value.toLowerCase()) !==
              -1 ||
            `${account.workshopName}`
              .toLowerCase()
              .indexOf(value.toLowerCase()) !== -1 ||
            `${account.branchName}`
              .toLowerCase()
              .indexOf(value.toLowerCase()) !== -1 ||
            `${account.workshopType}`
              .toLowerCase()
              .indexOf(value.toLowerCase()) !== -1 ||
            `${account.salesRep}`.toLowerCase().indexOf(value.toLowerCase()) !==
              -1 ||
            `${account.branch}`.toLowerCase().indexOf(value.toLowerCase()) !==
              -1
          );
        }),
      );

      setTableLoading(false);
      return;
    }

    if (name === 'start') {
      value = moment(value).format('YYYY-MM-DD');
    } else if (name === 'end') {
      value = moment(value).add(1, 'days').format('YYYY-MM-DD');
    }

    setInputValue((prevState) => ({
      ...prevState,
      [name]:
        typeof value !== 'object' && value !== 'none'
          ? value
          : value === 'none'
          ? ''
          : value.value,
    }));

    try {
      await dispatcher(
        getAllAccounts({
          auth,
          params: {
            ...inputValues,
            [name]:
              typeof value !== 'object' && value !== 'none'
                ? value
                : value === 'none'
                ? ''
                : value.value,
          },
        }),
      );

      setTableLoading(false);
    } catch (error) {
      setTableLoading(false);
    }
  };

  const activeColumn = useMemo(() => {
    return inputValues?.groupBy === 'branch'
      ? groupedByBranchColumn
      : inputValues?.groupBy === 'salesRep'
      ? groupedBySalesColumn
      : inputValues?.groupBy === 'workshopType'
      ? groupedByCustomerColumn
      : columns;
  }, [inputValues?.groupBy]);

  return (
    <Switch>
      <Route exact path={path}>
        <Box
        display='flex'
        justifyContent='right'
        mb='5px'
        >
        <Button
              isLoading={isLoading}
              variant='normal'
              onClick={() => history.push(`${url}/add-bulk-account`)}
            >
              + Upload Accounts
            </Button>
            </Box> 
      
        {isDistributor && (
          <Box display='flex' justifyContent='flex-end' mt='-65px' mb={6} width='100%'>
            
          </Box>
        )}

        <Tabs>
          <TabList>
            <Tab>Accounts</Tab>
            <Tab>Uploaded Files</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <ModifiedTableTop
                inputData={inputData}
                onChange={handleTableTopChange}
              />

              <DynamicTable
                columns={activeColumn}
                data={tableData}
                fetchData={() => console.log('...fetching')}
                skipPageReset={true}
                loading={tableLoading}
              />
            </TabPanel>
            <TabPanel>
              <DynamicTable
                columns={queueFileColumn}
                data={queuedFile}
                fetchData={() => console.log('...fetching')}
                skipPageReset={true}
                loading={fileQueueLoading}
                hidePagination
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
        <SimpleModal
          onClose={() => setOpenCommentModal({ isOpen: false, comment: '' })}
          isOpen={openCommentModal.isOpen}
          title='Comments on Uploaded file'
          hidefooter
        >
          <Box>{openCommentModal.comment}</Box>
        </SimpleModal>
      </Route>
      <Route exact path={`${path}/:id/acounts`}>
        <WorkshopAcct />
      </Route>
      <Route exact path={`${path}/add-bulk-account`}>
        <AccountBulk />
      </Route>
    </Switch>
  );
};

export default withToast(Accounts);
