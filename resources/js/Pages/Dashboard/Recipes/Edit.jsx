import React from "react";
import Form from "./Form";
import DashboardLayout from "@/Layouts/DashboardLayout";

export default function Edit(props) {
    return <Form {...props} mode="edit" />;
}

Edit.layout = (page) => <DashboardLayout children={page} />;
