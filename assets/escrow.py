import sys
from pyteal import *
from utils import parseArgs
from cosmos_approval import (
    TXN_TYPE_CREATE_SELL,
    TXN_TYPE_CREATE_AUCTION,
    TXN_TYPE_BUY,
    TXN_TYPE_REDEEM_CLOSE_ESCROW,
)


def logicsig(args):
    standard_fee = Int(1000)

    app_id = Int(args["APP_ID"])
    asset_id = Int(args["ASSET_ID"])
    user_address = Addr(args["USER_ADDRESS"])

    def fee_check(txn: int) -> NaryExpr:
        return Gtxn[txn].fee() == Mul(Global.group_size(), standard_fee)

    def zero_fee_check(txn: int) -> NaryExpr:
        return Gtxn[txn].fee() == Int(0)

    def no_close_txn_check(txn: int) -> NaryExpr:
        return Gtxn[txn].close_remainder_to() == Global.zero_address()

    def asset_opt_in_check(asset_id: Int, txn: int) -> NaryExpr:
        return And(
            Global.group_size() == Int(4),
            Gtxn[txn].type_enum() == TxnType.AssetTransfer,
            Gtxn[txn].sender() == Gtxn[txn].asset_receiver(),
            Gtxn[txn].xfer_asset() == asset_id,
            Gtxn[txn].asset_amount() == Int(0),
            Gtxn[txn].fee() == Int(0),
        )

    def app_check(app_id: Int, txn: int) -> NaryExpr:
        return And(
            Gtxn[txn].type_enum() == TxnType.ApplicationCall,
            Gtxn[txn].application_id() == app_id,
        )

    on_asset_opt_in = Seq(
        [
            Assert(
                And(
                    zero_fee_check(0),
                    asset_opt_in_check(asset_id, Int(0)),
                ),
            ),
            Int(1),
        ]
    )

    on_app_opt_in = Seq(
        [
            Assert(
                And(
                    zero_fee_check(1),
                    app_check(app_id, Int(2)),
                ),
            ),
            Int(1),
        ]
    )

    on_create_sell_or_auction = Seq(
        [
            Assert(And(on_asset_opt_in, on_app_opt_in)),
            Assert(
                And(
                    Global.group_size() == Int(4),
                    Gtxn[2].sender() == user_address,
                    Gtxn[2].sender() == Gtxn[3].sender(),
                    And(
                        Gtxn[2].accounts[1] == Gtxn[1].sender(),
                        Gtxn[2].accounts[1] == Gtxn[0].sender(),
                    ),
                    Gtxn[3].type_enum() == TxnType.AssetTransfer,
                    Gtxn[3].xfer_asset() == asset_id,
                    Gtxn[3].asset_amount() == Int(1),
                    fee_check(3),
                )
            ),
            Int(1),
        ]
    )

    on_buy = Seq(
        [
            Assert(
                And(
                    Global.group_size() == Int(3),
                    app_check(app_id, 0),
                    Gtxn[0].accounts[1] == Gtxn[2].sender(),
                    Gtxn[1].type_enum() == TxnType.Payment,
                    fee_check(1),
                    no_close_txn_check(1),
                    Gtxn[2].type_enum() == TxnType.AssetTransfer,
                    Gtxn[2].xfer_asset() == asset_id,
                    zero_fee_check(2),
                )
            ),
            Int(1),
        ]
    )

    on_redeem_close_escrow = Seq(
        [
            Assert(
                And(
                    Global.group_size() == Int(4),
                    Gtxn[0].sender() == Gtxn[3].receiver(),
                    app_check(app_id, 0),
                    Gtxn[0].accounts[1] == Gtxn[2].sender(),
                    fee_check(0),
                    Gtxn[1].type_enum() == TxnType.AssetTransfer,
                    zero_fee_check(1),
                    Or(
                        Gtxn[1].asset_amount() == Int(0),
                        Gtxn[1].asset_amount() == Int(1),
                    ),
                    Gtxn[1].asset_receiver() == user_address,
                    Gtxn[1].asset_receiver() == Gtxn[3].receiver(),
                    Gtxn[1].xfer_asset() == asset_id,
                    Gtxn[1].asset_close_to() == Gtxn[1].sender(),
                    app_check(app_id, 0),
                    Gtxn[2].type_enum() == TxnType.ApplicationCall,
                    Gtxn[2].on_completion() == OnComplete.CloseOut,
                    Gtxn[0].accounts[1] == Gtxn[2].sender(),
                    zero_fee_check(2),
                    Gtxn[2].sender() == Gtxn[3].sender(),
                    Gtxn[3].type_enum() == TxnType.Payment,
                    Gtxn[3].amount() == Int(0),
                    zero_fee_check(3),
                    Gtxn[3].close_remainder_to() == Gtxn[3].receiver(),
                )
            ),
            Int(1),
        ]
    )

    program = Cond(
        [
            Gtxn[1].on_completion() == OnComplete.OptIn,
            Cond(
                [
                    Or(
                        Gtxn[2].application_args[0] == TXN_TYPE_CREATE_SELL,
                        Gtxn[2].application_args[0] == TXN_TYPE_CREATE_AUCTION,
                    ),
                    on_create_sell_or_auction,
                ],
            ),
        ],
        [
            Gtxn[0].on_completion() == OnComplete.NoOp,
            Cond(
                [Gtxn[0].application_args[0] == TXN_TYPE_BUY, on_buy],
                [
                    Gtxn[0].application_args[0] == TXN_TYPE_REDEEM_CLOSE_ESCROW,
                    on_redeem_close_escrow,
                ],
            ),
        ],
    )

    return program


if __name__ == "__main__":
    params = {
        "APP_ID": 1,
        "ASSET_ID": 2,
        "USER_ADDRESS": "TEST",
    }

    if len(sys.argv) > 1:
        params = parseArgs(sys.argv[1], params)

    print(compileTeal(logicsig(params), Mode.Signature, version=3))
    with open("./assets/escrow.teal", "w") as f:
        f.write(compileTeal(logicsig(params), Mode.Signature, version=3))
