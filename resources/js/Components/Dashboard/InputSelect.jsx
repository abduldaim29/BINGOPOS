import React, { useState } from 'react'
import { Combobox, Listbox } from '@headlessui/react'
import { IconChevronDown, IconCircle, IconCircleFilled, IconSearch } from '@tabler/icons-react'

export default function InputSelect({ selected, data, setSelected, label, errors, placeholder, multiple = false, searchable = false, searchableInput = false, displayKey = 'name' }) {
    const [search, setSearch] = useState('')

    const filteredData = data.filter(item =>
        String(item[displayKey] || '').toLowerCase().includes(search.toLowerCase())
    )

    if (searchableInput) {
        return (
            <div className='flex flex-col gap-2'>
                <label className='text-gray-600 text-sm'>{label}</label>
                <Combobox value={selected || null} onChange={setSelected} by="id">
                    <div className='relative'>
                        <div className='relative'>
                            <IconSearch size={17} className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' />
                            <Combobox.Input
                                displayValue={(item) => item?.[displayKey] || ''}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={placeholder}
                                className='w-full rounded-md border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-700 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300'
                            />
                        </div>
                        <Combobox.Options className='absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-800 dark:bg-gray-950'>
                            {filteredData.length ? filteredData.map((item) => (
                                <Combobox.Option
                                    key={item.id}
                                    value={item}
                                    className={({ active }) => `cursor-pointer rounded-md px-3 py-2 text-sm ${active ? 'bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'}`}
                                >
                                    {item[displayKey]}
                                </Combobox.Option>
                            )) : (
                                <li className='px-3 py-2 text-sm text-gray-500'>No results found</li>
                            )}
                        </Combobox.Options>
                    </div>
                </Combobox>
                {errors && <small className='text-xs text-red-500'>{errors}</small>}
            </div>
        )
    }

    return (
        <div className='flex flex-col gap-2'>
            <label className='text-gray-600 text-sm'>{label}</label>
            <Listbox value={selected} onChange={setSelected} multiple={multiple} by="id">
                <Listbox.Button className={'w-full px-3 py-1.5 border text-sm rounded-md focus:outline-none focus:ring-0 flex justify-between items-center gap-8 bg-white text-gray-700 focus:border-gray-200 border-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:focus:border-gray-700 dark:border-gray-800'}>
                    {multiple ? (
                        selected.length > 0 ? selected.map(item => item[displayKey]).join(', ') : placeholder
                    ) : (
                        selected ? selected[displayKey] : placeholder
                    )}
                    <IconChevronDown size={20} strokeWidth={1.5} />
                </Listbox.Button>
                <Listbox.Options className={'p-4 border rounded-lg flex flex-col gap-2 bg-gray-100 dark:border-gray-900 dark:bg-gray-950'}>
                    {searchable && (
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search..."
                            className="w-full px-3 py-1.5 mb-2 text-sm border rounded-md bg-white text-gray-700 border-gray-200 focus:outline-none focus:border-gray-300 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-800 dark:focus:border-gray-700"
                        />
                    )}
                    {filteredData.map((item) => (
                        <Listbox.Option key={item.id} value={item}>
                            {({ selected }) => (
                                <div
                                    className='text-sm cursor-pointer px-3 py-1.5 rounded-lg flex items-center gap-2 bg-white text-gray-700 hover:bg-gray-200 border dark:bg-gray-900 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 '>
                                    {selected ? <IconCircleFilled size={15} strokeWidth={1.5} className='text-teal-500' /> : <IconCircle size={15} strokeWidth={1.5} />}
                                    {item[displayKey]}
                                </div>
                            )}
                        </Listbox.Option>
                    ))}
                </Listbox.Options>
            </Listbox>
            {errors && (
                <small className='text-xs text-red-500'>{errors}</small>
            )}
        </div>
    )
}
