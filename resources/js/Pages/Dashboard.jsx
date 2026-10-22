import Card from '@/Components/Dashboard/Card';
import Table from '@/Components/Dashboard/Table';
import Widget from '@/Components/Dashboard/Widget';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head } from '@inertiajs/react';
import { IconBox, IconCategory, IconMoneybag, IconUsers } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

export default function Dashboard() {
    const { t } = useTranslation();

    return (
        <>
            <Head title='Dashboard' />
            <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4'>
                <Widget
                    title={t('dashboard.widgets.categories')}
                    subtitle={t('dashboard.widgets.totalCategories')}
                    color={'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200'}
                    icon={<IconCategory size={'20'} strokeWidth={'1.5'} />}
                    total={20}
                />
                <Widget
                    title={t('dashboard.widgets.products')}
                    subtitle={t('dashboard.widgets.totalProducts')}
                    color={'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200'}
                    icon={<IconBox size={'20'} strokeWidth={'1.5'} />}
                    total={30}
                />
                <Widget
                    title={t('dashboard.widgets.transactions')}
                    subtitle={t('dashboard.widgets.totalTransactions')}
                    color={'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200'}
                    icon={<IconMoneybag size={'20'} strokeWidth={'1.5'} />}
                    total={45}
                />
                <Widget
                    title={t('dashboard.widgets.users')}
                    subtitle={t('dashboard.widgets.totalUsers')}
                    color={'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200'}
                    icon={<IconUsers size={'20'} strokeWidth={'1.5'} />}
                    total={2}
                />
            </div>
        </>
    );
}

Dashboard.layout = page => <DashboardLayout children={page} />;