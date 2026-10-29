import React from "react";
import Form from "./Form";
import DashboardLayout from "@/Layouts/DashboardLayout";

export default function Create(props) {
    return <Form {...props} mode="create" />;
}

Create.layout = (page) => <DashboardLayout children={page} />;
