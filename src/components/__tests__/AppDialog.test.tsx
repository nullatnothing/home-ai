import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { AppDialog } from "../AppDialog";
import { translations } from "../../constants";

describe("AppDialog", () => {
  it("renders fallback copy when no dialog is present and confirms the default action", async () => {
    const onDismiss = jest.fn();
    const { getByText } = await render(
      <AppDialog dialog={{ message: "Body" } as any} strings={translations.en} onDismiss={onDismiss} />,
    );

    expect(getByText(translations.en.info)).toBeTruthy();
    expect(getByText(translations.en.ok)).toBeTruthy();

    fireEvent.press(getByText(translations.en.ok));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("invokes cancel and confirm callbacks before dismissing", async () => {
    const onDismiss = jest.fn();
    const onCancel = jest.fn();
    const onConfirm = jest.fn();

    const { getByText } = await render(
      <AppDialog
        dialog={{
          title: "Delete chat",
          message: "Are you sure?",
          cancelText: "Cancel",
          confirmText: "Delete",
          onCancel,
          onConfirm,
        }}
        strings={translations.en}
        onDismiss={onDismiss}
      />,
    );

    fireEvent.press(getByText("Cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);

    fireEvent.press(getByText("Delete"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(2);
  });
});
