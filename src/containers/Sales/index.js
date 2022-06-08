import React, { useMemo, useState, useRef, useEffect } from 'react';
import DynamicTable from '../../components/DynamicTable';
import { useIntl } from 'react-intl';
import {
  Box,
  Button,
  Link,
  Alert,
  AlertIcon,
  AlertDescription,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Badge,
} from '@chakra-ui/react';
import ModifiedTableTop from '../../components/TableTop/ModifiedTableTop';
import readXlsxFile from 'read-excel-file';
import { getAllSales, selectSales, getQueuedFiles } from './slice';
import { useSelector, useDispatch } from 'react-redux';
import moment from 'moment';
import {
  useRouteMatch,
  Switch,
  Route,
  Link as ReactLink,
  useHistory,
} from 'react-router-dom';
import WorkshopAcct from './WorkshopAccount';
import withToast from '../../HOCs/withToast';
import messages from './messages';
import getMoneyFormat from '../../utils/getMoneyFormat';
import SalesBulk from '../../components/SalesBulk/Loadable';
import enums from '../../utils/enums';
import SimpleModal from '../../components/Modal';
import { selectGlobalState } from '../../globalSlice';

const Sales = ({ notification }) => {
  const [inputValues, setInputValue] = useState({
    end: moment().format('MM-YYYY'),
    start: moment().format('MM-YYYY'),
  });
  const intl = useIntl();
  const [isLoading, setIsLoading] = useState(false);
  const auth = useSelector((state) => state.auth);
  const { allSales, queuedFile } = useSelector(selectSales);

  const dispatcher = useDispatch();
  const { url, path } = useRouteMatch();
  const [tableLoading, setTableLoading] = useState(false);
  const [fileQueueLoading, setFileQueueLoading] = useState(false);
  const [tableData, setTableData] = useState([]);
  const history = useHistory();
  const [openCommentModal, setOpenCommentModal] = useState({
    isOpen: false,
    comment: '',
  });
  const { isDistributor } = useSelector(selectGlobalState);

  useEffect(() => {
    (async () => {
      setTableLoading(true);
      await dispatcher(getAllSales({ auth, params: {} }));
      setTableLoading(false);
      setFileQueueLoading(true);
      dispatcher(getQueuedFiles({ auth }));
      setFileQueueLoading(false);
    })();
  }, []);

  useEffect(() => {
    setTableData(allSales);
  }, [allSales]);

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
            <Link href={value?.path ?? ''} target='_blank'>
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
        Header: intl.formatMessage(messages.retailQty),
        accessor: 'retailQty',
      },
      {
        Header: intl.formatMessage(messages.retailSell),
        accessor: 'retailSell',
        Cell: ({ value }) => getMoneyFormat(value),
      },
      {
        Header: intl.formatMessage(messages.returnQty),
        accessor: 'returnQty',
      },
      {
        Header: intl.formatMessage(messages.returnSell),
        accessor: 'returnSell',
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
        Header: intl.formatMessage(messages.retailQty),
        accessor: 'retailQty',
      },
      {
        Header: intl.formatMessage(messages.retailSell),
        accessor: 'retailSell',
        Cell: ({ value }) => getMoneyFormat(value),
      },
      {
        Header: intl.formatMessage(messages.returnQty),
        accessor: 'returnQty',
      },
      {
        Header: intl.formatMessage(messages.returnSell),
        accessor: 'returnSell',
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
        Header: intl.formatMessage(messages.retailQty),
        accessor: 'retailQty',
      },
      {
        Header: intl.formatMessage(messages.retailSell),
        accessor: 'retailSell',
        Cell: ({ value }) => getMoneyFormat(value),
      },
      {
        Header: intl.formatMessage(messages.returnQty),
        accessor: 'returnQty',
      },
      {
        Header: intl.formatMessage(messages.returnSell),
        accessor: 'returnSell',
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
        Header: intl.formatMessage(messages.retailQty),
        accessor: 'retailQty',
      },
      {
        Header: intl.formatMessage(messages.retailSell),
        accessor: 'retailSell',
        Cell: ({ value }) => getMoneyFormat(value),
      },
      {
        Header: intl.formatMessage(messages.returnQty),
        accessor: 'returnQty',
      },
      {
        Header: intl.formatMessage(messages.returnSell),
        accessor: 'returnSell',
        Cell: ({ value }) => getMoneyFormat(value),
      },
    ],
    [],
  );

  const handleTableTopChange = async (e, name) => {
    setTableLoading(true);
    let { end, start, ...prevInputValues } = { ...inputValues };

    let value = e.hasOwnProperty('target')
      ? `${e.target.value}`.trim()
      : `${e.value}`.trim();

    if (name === 'searchAccount') {
      setTableData(
        [...allSales].filter((account) => {
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
      start = moment(value).format('MM-YYYY');

      value = `${start},${end}`;
      name = 'month';

      const newData = {
        ...inputValues,
        start,
      };
      setInputValue(newData);
    } else if (name === 'end') {
      end = moment(value).format('MM-YYYY');
      value = `${start},${end}`;
      name = 'month';

      const newData = {
        ...inputValues,
        end,
      };

      setInputValue(newData);
    } else {
      setInputValue((prevState) => ({
        ...prevState,
        [name]:
          typeof value !== 'object' && value !== 'none'
            ? value
            : value === 'none'
            ? ''
            : value.value,
      }));
    }

    try {
      await dispatcher(
        getAllSales({
          auth,
          params: {
            ...prevInputValues,
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
                onClick={() => history.push(`${url}/add-bulk-sales`)}
              >
                + Upload Sales
              </Button>
              </Box>

        <Box minHeight='80vh' mt='-65px'>
          {isDistributor && (
            <Box display='flex' justifyContent='flex-end' mb={6} width='100%'>
             
            </Box>
          )}
          <Tabs>
            <TabList>
              <Tab>Sales</Tab>
              {isDistributor && <Tab>Uploaded Files</Tab>}
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
        </Box>
        <SimpleModal
          onClose={() => setOpenCommentModal({ isOpen: false, comment: '' })}
          isOpen={openCommentModal.isOpen}
          title='Comments on Uploaded file'
          hidefooter
        >
          <Box>{openCommentModal.comment}</Box>
        </SimpleModal>
      </Route>
      <Route exact path={`${path}/add-bulk-sales`}>
        <SalesBulk />
      </Route>
    </Switch>
  );
};

export default withToast(Sales);
